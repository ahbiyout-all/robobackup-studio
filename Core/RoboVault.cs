using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Security;
using System.Security.Cryptography;
using System.Text;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core DLL 4/5] RoboVault
    /// DPAPI 기반 제로-로그인 NAS 보안 볼트
    /// Windows Credential Manager 네이티브 API와 Windows DPAPI를 바인딩하여,
    /// 디스크나 스크립트에 비밀번호를 일절 평문 저장하지 않고 안전한 격리 영역에 암호화 보관/조회합니다.
    /// </summary>
    public class RoboVault
    {
        #region Native Win32 Credential Manager API

        private const int CRED_TYPE_GENERIC = 1;
        private const int CRED_PERSIST_LOCAL_MACHINE = 2;
        private const int CRED_PERSIST_ENTERPRISE = 3;

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct CREDENTIAL
        {
            public int Flags;
            public int Type;
            public string TargetName;
            public string Comment;
            public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
            public int CredentialBlobSize;
            public IntPtr CredentialBlob;
            public int Persist;
            public int AttributeCount;
            public IntPtr Attributes;
            public string TargetAlias;
            public string UserName;
        }

        [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

        [DllImport("Advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool CredWrite([In] ref CREDENTIAL userCredential, [In] uint flags);

        [DllImport("Advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool CredDelete(string target, int type, int flags);

        [DllImport("Advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
        private static extern void CredFree([In] IntPtr cred);

        #endregion

        public class VaultCredentialInfo
        {
            public string Target { get; set; } = string.Empty;
            public string UserName { get; set; } = string.Empty;
            public DateTime LastModified { get; set; } = DateTime.Now;
            public bool IsEncryptedWithDpapi { get; set; } = true;
        }

        /// <summary>
        /// NAS 대상 경로에 대한 자격 증명을 Windows Credential Manager에 안전하게 저장합니다.
        /// </summary>
        public static bool SaveCredential(string target, string userName, string password)
        {
            if (string.IsNullOrWhiteSpace(target))
                throw new ArgumentException("대상 NAS 서버/경로를 지정해야 합니다.", nameof(target));

            byte[] passBytes = Encoding.Unicode.GetBytes(password ?? string.Empty);
            IntPtr passPtr = Marshal.AllocHGlobal(passBytes.Length);

            try
            {
                Marshal.Copy(passBytes, 0, passPtr, passBytes.Length);

                var cred = new CREDENTIAL
                {
                    Type = CRED_TYPE_GENERIC,
                    TargetName = NormalizeTarget(target),
                    UserName = userName,
                    CredentialBlobSize = passBytes.Length,
                    CredentialBlob = passPtr,
                    Persist = CRED_PERSIST_LOCAL_MACHINE,
                    Comment = "RoboBackup Studio DPAPI Secured Vault"
                };

                return CredWrite(ref cred, 0);
            }
            finally
            {
                // 메모리 즉시 영구 삭제 (ZeroMemory)
                Array.Clear(passBytes, 0, passBytes.Length);
                Marshal.FreeHGlobal(passPtr);
            }
        }

        /// <summary>
        /// Windows Credential Manager에서 자격 증명을 조회합니다.
        /// </summary>
        public static bool TryGetCredential(string target, out string userName, out string password)
        {
            userName = string.Empty;
            password = string.Empty;

            string normTarget = NormalizeTarget(target);
            if (!CredRead(normTarget, CRED_TYPE_GENERIC, 0, out IntPtr credPtr))
                return false;

            try
            {
                var cred = Marshal.PtrToStructure<CREDENTIAL>(credPtr);
                userName = cred.UserName ?? string.Empty;

                if (cred.CredentialBlobSize > 0 && cred.CredentialBlob != IntPtr.Zero)
                {
                    byte[] passBytes = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, passBytes, 0, cred.CredentialBlobSize);
                    password = Encoding.Unicode.GetString(passBytes);
                    Array.Clear(passBytes, 0, passBytes.Length);
                }

                return true;
            }
            finally
            {
                CredFree(credPtr);
            }
        }

        /// <summary>
        /// 등록된 자격 증명을 삭제합니다.
        /// </summary>
        public static bool DeleteCredential(string target)
        {
            return CredDelete(NormalizeTarget(target), CRED_TYPE_GENERIC, 0);
        }

        /// <summary>
        /// 로컬 사용자 DPAPI를 사용하여 민감한 토큰 또는 설정 문자열을 가역 암호화합니다.
        /// </summary>
        public static string EncryptSecretString(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return string.Empty;
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] encrypted = ProtectedData.Protect(plainBytes, null, DataProtectionScope.CurrentUser);
            return Convert.ToBase64String(encrypted);
        }

        /// <summary>
        /// DPAPI로 암호화된 문자열을 복호화합니다.
        /// </summary>
        public static string DecryptSecretString(string encryptedBase64)
        {
            if (string.IsNullOrEmpty(encryptedBase64)) return string.Empty;
            try
            {
                byte[] cipherBytes = Convert.FromBase64String(encryptedBase64);
                byte[] decrypted = ProtectedData.Unprotect(cipherBytes, null, DataProtectionScope.CurrentUser);
                return Encoding.UTF8.GetString(decrypted);
            }
            catch
            {
                return string.Empty;
            }
        }

        private static string NormalizeTarget(string target)
        {
            return target.Trim().TrimEnd('\\');
        }
    }
}
