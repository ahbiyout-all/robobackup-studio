# 📜 Third-Party Open Source Software Licenses & Legal Notices

**RoboBackup Studio (v2.17.8)**
- **Lead Developer**: AhBiYout
- **Tech Blog**: https://ahbiyoutvibe.blogspot.com/
- **GitHub Repository**: https://github.com/AhBiYout-all/robobackup-studio
- **Copyright**: (c) 2026 AhBiYout. All rights reserved.

본 소프트웨어는 상업적 이용 및 재배포가 자유로운 오픈소스 컴포넌트와 Windows OS 표준 내장 유틸리티를 기반으로 제작되었습니다. 본 문서에는 본 프로그램에 포함되거나 연동된 오픈소스 및 제3자 소프트웨어의 라이선스 고지사항이 기재되어 있습니다.

---

## 1. RoboBackup Studio 본 프로그램 라이선스 (MIT License)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 2. .NET Runtime & WPF Framework (.NET Foundation / Microsoft)

- **Library**: .NET 8.0 / .NET 9.0 SDK, Windows Presentation Foundation (WPF), `System.Text.Encoding.CodePages`
- **License**: MIT License
- **Copyright**: (c) .NET Foundation and Contributors.
- **Website**: https://github.com/dotnet/wpf / https://github.com/dotnet/runtime

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...

---

## 3. Lucide Icons (Lucide Project)

- **Library**: `lucide-react` / Vector SVG Assets
- **License**: ISC License
- **Copyright**: (c) 2022-2026, Lucide Contributors.
- **Website**: https://lucide.dev

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION...

---

## 4. React & React DOM (Meta Platforms, Inc.)

- **Library**: `react`, `react-dom`
- **License**: MIT License
- **Copyright**: (c) Meta Platforms, Inc. and affiliates.
- **Website**: https://react.dev

---

## 5. Tailwind CSS (Tailwind Labs Inc.)

- **Library**: `tailwindcss`, `@tailwindcss/vite`
- **License**: MIT License
- **Copyright**: (c) Tailwind Labs Inc.
- **Website**: https://tailwindcss.com

---

## 6. Framer Motion / Motion (Motion Software Limited)

- **Library**: `motion`
- **License**: MIT License
- **Copyright**: (c) 2018 Motion Software Limited
- **Website**: https://motion.dev

---

## 7. Windows 내장 도구 연동에 관한 고지 (Microsoft Windows OS)

- **대상 유틸리티**: `robocopy.exe`, `schtasks.exe`, `cmdkey.exe`, `net.exe`
- **고지 사항**:
  - RoboBackup Studio는 마이크로소프트 사의 독점 바이너리(`robocopy.exe` 등)를 자체 추출·변조하거나 앱 패키지 내부에 번들링하여 무단 재배포하지 않습니다.
  - 사용자의 Windows 정품 운영체제 시스템 디렉토리(`%SystemRoot%\System32`)에 이미 기본 설치되어 있는 표준 실행 명령어를 C# `Process.Start` API를 통해 안전하게 호출하는 GUI 프론트엔드 및 관리자 도구로 작동합니다.
  - Microsoft, Windows, Robocopy는 미국 및 기타 국가에서 Microsoft Corporation의 등록 상표입니다.

---

## 8. 소프트웨어 면책 조항 (Warranty Disclaimer)

- 본 소프트웨어는 '있는 그대로(AS-IS)' 제공되며, 상품성이나 특정 목적에의 적합성에 대한 묵시적 보증을 포함하여 어떠한 종류의 명시적·묵시적 보증도 제공하지 않습니다.
- Robocopy의 동기화 플래그(특히 `/MIR` 미러링 삭제, `/PURGE`) 및 오래된 파일 자동 삭제 스케줄러 기능은 대상 폴더의 불필요한 파일을 영구 삭제할 수 있습니다.
- 개발자 및 배포자는 사용자의 오작동, 경로 설정 실수, 하드웨어 불량, 정전 및 네트워크 장애로 인한 데이터 손실에 대해 책임을 지지 않습니다. 중요한 데이터는 항상 이중 백업을 권장합니다.
