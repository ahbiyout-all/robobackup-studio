using System;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core DLL 2/5] RoboVssProvider
    /// Windows 볼륨 섀도 복사본(Volume Shadow Copy Service, VSS) 스냅샷 프로바이더
    /// 열려 있는 엑셀 파일, SQL 데이터베이스(.mdf), Outlook(.pst) 등 잠긴 파일을 무중단 상태에서 100% 무결점 복제할 수 있도록 지원합니다.
    /// </summary>
    public class RoboVssProvider : IDisposable
    {
        public class VssSnapshotInfo
        {
            public string SourceDrive { get; set; } = string.Empty;
            public string ShadowCopyVolume { get; set; } = string.Empty; // e.g. \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1
            public string ShadowId { get; set; } = string.Empty;
            public string MountPoint { get; set; } = string.Empty; // Win32 mklink /d junction for Robocopy
            public string ErrorMessage { get; set; } = string.Empty;
            public bool IsMock { get; set; } = false;
            public DateTime CreatedAt { get; set; } = DateTime.Now;
            public bool IsActive => !string.IsNullOrEmpty(ShadowCopyVolume) && !IsMock;
        }

        private VssSnapshotInfo? _currentSnapshot;

        public VssSnapshotInfo? CurrentSnapshot => _currentSnapshot;

        /// <summary>
        /// 지정한 드라이브(예: "C:")의 볼륨 섀도 스냅샷을 생성합니다.
        /// 절대 임의의 Mock 경로를 반환하지 않으며, 실패 시 IsActive=false 및 ErrorMessage를 반환합니다.
        /// </summary>
        public async Task<VssSnapshotInfo> CreateSnapshotAsync(string driveLetter)
        {
            if (string.IsNullOrWhiteSpace(driveLetter))
                throw new ArgumentException("드라이브 문자를 지정해야 합니다.", nameof(driveLetter));

            driveLetter = driveLetter.Trim().TrimEnd('\\');
            if (driveLetter.Length == 1) driveLetter += ":";

            var info = new VssSnapshotInfo { SourceDrive = driveLetter };

            await Task.Run(() =>
            {
                try
                {
                    // 1단계: Windows Server 표준 vssadmin create shadow 시도
                    var psi = new ProcessStartInfo
                    {
                        FileName = "vssadmin",
                        Arguments = $"create shadow /for={driveLetter}",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    using var proc = Process.Start(psi);
                    if (proc != null)
                    {
                        string output = proc.StandardOutput.ReadToEnd();
                        string error = proc.StandardError.ReadToEnd();
                        proc.WaitForExit();

                        // 영문 및 한글 Windows vssadmin 출력 정규식 매칭
                        var matchVolume = Regex.Match(output, @"(?:Shadow Copy Volume Name|섀도 복사본 볼륨 이름)\s*:\s*([^\r\n]+)", RegexOptions.IgnoreCase);
                        if (matchVolume.Success)
                        {
                            info.ShadowCopyVolume = matchVolume.Groups[1].Value.Trim().TrimEnd('\\');
                        }

                        var matchId = Regex.Match(output, @"(?:Shadow Copy ID|섀도 복사본 ID)\s*:\s*\{?([a-fA-F0-9\-]+)\}?", RegexOptions.IgnoreCase);
                        if (matchId.Success)
                        {
                            info.ShadowId = matchId.Groups[1].Value.Trim();
                        }
                    }

                    // 2단계: vssadmin 실패 시 (Windows 10/11 클라이언트 OS), PowerShell WMI Win32_ShadowCopy 시도
                    if (string.IsNullOrEmpty(info.ShadowCopyVolume))
                    {
                        string psCmd = $"$r = (Get-WmiObject -List Win32_ShadowCopy).Create('{driveLetter}\\', 'ClientAccessible'); " +
                                       "if ($r.ReturnValue -eq 0) { " +
                                       "  $s = Get-WmiObject Win32_ShadowCopy | Where-Object { $_.ID -eq $r.ShadowID }; " +
                                       "  Write-Output ('SHADOW_VOL:' + $s.DeviceObject); " +
                                       "  Write-Output ('SHADOW_ID:' + $r.ShadowID) " +
                                       "} else { Write-Output ('ERROR_CODE:' + $r.ReturnValue) }";

                        var psiPs = new ProcessStartInfo
                        {
                            FileName = "powershell.exe",
                            Arguments = $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"{psCmd}\"",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };

                        using var procPs = Process.Start(psiPs);
                        if (procPs != null)
                        {
                            string psOutput = procPs.StandardOutput.ReadToEnd();
                            procPs.WaitForExit();

                            var mVol = Regex.Match(psOutput, @"SHADOW_VOL:([^\r\n]+)", RegexOptions.IgnoreCase);
                            if (mVol.Success)
                            {
                                info.ShadowCopyVolume = mVol.Groups[1].Value.Trim().TrimEnd('\\');
                            }

                            var mId = Regex.Match(psOutput, @"SHADOW_ID:\{?([a-fA-F0-9\-]+)\}?", RegexOptions.IgnoreCase);
                            if (mId.Success)
                            {
                                info.ShadowId = mId.Groups[1].Value.Trim();
                            }
                        }
                    }

                    // 3단계: 섀도 복사본이 생성된 경우, Win32 / Robocopy 호환을 위한 임시 마운트 포인트(디렉터리 심볼릭 링크) 생성
                    if (!string.IsNullOrEmpty(info.ShadowCopyVolume))
                    {
                        string tempMount = Path.Combine(Path.GetTempPath(), $"RoboVss_{Guid.NewGuid():N}");
                        string targetDevice = info.ShadowCopyVolume.EndsWith("\\") ? info.ShadowCopyVolume : (info.ShadowCopyVolume + "\\");

                        var linkPsi = new ProcessStartInfo
                        {
                            FileName = "cmd.exe",
                            Arguments = $"/c mklink /d \"{tempMount}\" \"{targetDevice}\"",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };

                        using var linkProc = Process.Start(linkPsi);
                        linkProc?.WaitForExit(3000);

                        if (Directory.Exists(tempMount))
                        {
                            info.MountPoint = tempMount;
                        }
                    }
                    else
                    {
                        info.ErrorMessage = "Windows VSS 서비스 또는 권한 제약으로 섀도 복사본을 생성할 수 없습니다.";
                    }
                }
                catch (Exception ex)
                {
                    info.ErrorMessage = ex.Message;
                    info.ShadowCopyVolume = string.Empty;
                    info.ShadowId = string.Empty;
                    info.MountPoint = string.Empty;
                }
            });

            _currentSnapshot = info;
            return info;
        }

        /// <summary>
        /// 원본 경로를 VSS 스냅샷 볼륨의 읽기 전용 경로로 변환합니다.
        /// 마운트 포인트(심볼릭 링크)가 존재하면 해당 링크를 통해 Win32 경로를 제공하며, 접근 불가능할 경우 원본 경로를 반환합니다.
        /// </summary>
        public string GetVssPath(string originalFullPath)
        {
            if (_currentSnapshot == null || !_currentSnapshot.IsActive)
                return originalFullPath;

            string root = Path.GetPathRoot(originalFullPath) ?? "";
            if (!string.Equals(root.TrimEnd('\\'), _currentSnapshot.SourceDrive, StringComparison.OrdinalIgnoreCase))
                return originalFullPath;

            string relative = originalFullPath.Substring(root.Length).TrimStart('\\');

            // 1순위: Win32 호환 임시 마운트 포인트 사용 (Robocopy Error 53 원천 방지)
            if (!string.IsNullOrEmpty(_currentSnapshot.MountPoint) && Directory.Exists(_currentSnapshot.MountPoint))
            {
                string mountedPath = Path.Combine(_currentSnapshot.MountPoint, relative);
                if (Directory.Exists(mountedPath) || File.Exists(mountedPath))
                {
                    return mountedPath;
                }
            }

            // 2순위: 네이티브 섀도 볼륨 디바이스 경로 (존재 검증 완료 시에만 반환)
            if (!string.IsNullOrEmpty(_currentSnapshot.ShadowCopyVolume))
            {
                string rawVssPath = Path.Combine(_currentSnapshot.ShadowCopyVolume, relative);
                if (Directory.Exists(rawVssPath) || File.Exists(rawVssPath))
                {
                    return rawVssPath;
                }
            }

            // 검증되지 않은 경로는 절대 반환하지 않고 원본 경로 유지
            return originalFullPath;
        }

        /// <summary>
        /// 생성된 섀도 스냅샷 및 임시 마운트 심볼릭 링크를 안전하게 삭제하여 시스템 리소스를 환수합니다.
        /// </summary>
        public async Task ReleaseSnapshotAsync()
        {
            if (_currentSnapshot == null)
                return;

            string shadowId = _currentSnapshot.ShadowId;
            string mountPoint = _currentSnapshot.MountPoint;
            _currentSnapshot = null;

            await Task.Run(() =>
            {
                // 1. 임시 마운트 심볼릭 링크 안전 제거 (링크만 삭제, 원본 볼륨 손상 없음)
                if (!string.IsNullOrEmpty(mountPoint))
                {
                    try
                    {
                        var rmPsi = new ProcessStartInfo
                        {
                            FileName = "cmd.exe",
                            Arguments = $"/c rmdir \"{mountPoint}\"",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };
                        using var rmProc = Process.Start(rmPsi);
                        rmProc?.WaitForExit(3000);
                    }
                    catch { }
                }

                // 2. VSS 스냅샷 삭제 (vssadmin 및 WMI 병행)
                if (!string.IsNullOrEmpty(shadowId))
                {
                    try
                    {
                        var psi = new ProcessStartInfo
                        {
                            FileName = "vssadmin",
                            Arguments = $"delete shadows /shadow={{{shadowId}}} /quiet",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };
                        using var proc = Process.Start(psi);
                        proc?.WaitForExit(4000);
                    }
                    catch { }

                    try
                    {
                        var psiPs = new ProcessStartInfo
                        {
                            FileName = "powershell.exe",
                            Arguments = $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"(Get-WmiObject Win32_ShadowCopy | Where-Object {{ $_.ID -eq '{{{shadowId}}}' -or $_.ID -eq '{shadowId}' }}).Delete()\"",
                            RedirectStandardOutput = true,
                            RedirectStandardError = true,
                            UseShellExecute = false,
                            CreateNoWindow = true
                        };
                        using var procPs = Process.Start(psiPs);
                        procPs?.WaitForExit(4000);
                    }
                    catch { }
                }
            });
        }

        public void Dispose()
        {
            ReleaseSnapshotAsync().GetAwaiter().GetResult();
        }
    }
}
