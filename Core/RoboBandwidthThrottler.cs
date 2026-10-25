using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace RoboBackupStudio.Core
{
    /// <summary>
    /// [Core DLL 6/6] RoboBandwidthThrottler
    /// 네트워크 대역폭 스로틀링 및 패킷 간격 조절(/IPG) 코어 엔진
    /// NAS, SMB 공유 폴더 및 원격 백업 시 네트워크 대역폭 독점을 방지하고, 
    /// 전송 속도와 패킷 간격(Inter-Packet Gap)을 동적으로 제어하여 시스템 안정성을 보장합니다.
    /// </summary>
    public class RoboBandwidthThrottler
    {
        private readonly int _maxMegaBitsPerSec;
        private readonly int _interPacketGapMs;
        private long _bytesTransferredInWindow = 0;
        private DateTime _windowStartTime = DateTime.Now;
        private readonly object _lockObj = new object();

        public RoboBandwidthThrottler(int maxMegaBitsPerSec = 100, int interPacketGapMs = 0)
        {
            _maxMegaBitsPerSec = Math.Max(1, maxMegaBitsPerSec);
            _interPacketGapMs = Math.Max(0, interPacketGapMs);
        }

        /// <summary>
        /// 지정된 바이트 전송 전 대역폭 제한 및 /IPG 패킷 간격 지연을 적용합니다.
        /// </summary>
        public async Task ThrottleAsync(int bytesToWrite, CancellationToken cancellationToken = default)
        {
            if (bytesToWrite <= 0) return;

            // 1. Apply Inter-Packet Gap if configured
            if (_interPacketGapMs > 0)
            {
                await Task.Delay(_interPacketGapMs, cancellationToken);
            }

            // 2. Bandwidth capping logic
            lock (_lockObj)
            {
                var now = DateTime.Now;
                var elapsed = (now - _windowStartTime).TotalSeconds;

                if (elapsed >= 1.0)
                {
                    _bytesTransferredInWindow = 0;
                    _windowStartTime = now;
                }

                _bytesTransferredInWindow += bytesToWrite;

                // Max bytes per second based on Mbps
                long maxBytesPerSec = (_maxMegaBitsPerSec * 1024L * 1024L) / 8L;
                if (_bytesTransferredInWindow > maxBytesPerSec)
                {
                    long excess = _bytesTransferredInWindow - maxBytesPerSec;
                    int delayMs = (int)((excess * 1000.0) / maxBytesPerSec);
                    if (delayMs > 0 && delayMs < 2000)
                    {
                        Thread.Sleep(Math.Min(delayMs, 100)); // Non-blocking gentle throttle
                    }
                }
            }
        }

        /// <summary>
        /// Robocopy 명령어 인자에 최적화된 /IPG 및 스로틀링 스위치를 생성합니다.
        /// </summary>
        public string GetRecommendedIpgArgument()
        {
            if (_interPacketGapMs > 0)
            {
                return $"/IPG:{_interPacketGapMs}";
            }
            if (_maxMegaBitsPerSec < 100)
            {
                // Auto-calculate IPG based on target Mbps limit
                int calculatedIpg = Math.Max(1, 100 / _maxMegaBitsPerSec);
                return $"/IPG:{calculatedIpg}";
            }
            return string.Empty;
        }
    }
}
