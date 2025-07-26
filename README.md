# 감사일기 with AI 피드백 코치

매일 3가지 감사한 일을 감정과 함께 기록하면, Gemini-2.0-Flash를 통해 정서적 피드백을 제공하고 월간 감정 변화와 감사 습관을 시각적으로 리포팅하여 감정 자각, 자기 돌봄, 긍정 감정 지속을 도와주는 심리 코칭형 감사일기 서비스입니다.

## 🌟 주요 기능

### 1. 감사일기 작성
- **날짜 선택**: 원하는 날짜에 일기 작성 가능
- **감정 선택**: 6가지 감정 중 선택 (행복, 기쁨, 뿌듯, 편안, 피곤, 우울)
- **3가지 감사 항목**: 나, 타인, 상황에 대한 감사 기록 (50자 내외)
- **AI 피드백**: 감정 상태에 따른 맞춤형 심리 코칭 피드백

### 2. 일기 관리
- **일기 목록**: 작성한 모든 일기를 날짜순으로 확인
- **일기 수정**: 기존 일기 수정 및 삭제 기능
- **로컬 저장**: 브라우저에 안전하게 일기 데이터 저장

### 3. 월간 감정 리포트
- **감정 분포**: 월별 감정 통계 및 시각화
- **긍정률**: 긍정적 감정 비율 계산
- **키워드 분석**: 자주 감사했던 키워드 추출
- **기록률**: 월간 일기 작성 빈도 분석

### 4. 감정별 AI 코칭
- **긍정적 감정**: 감정의 원천 해석 및 지속 유도
- **편안한 감정**: 현재 상태 수용 및 정서 유지 지지
- **힘든 감정**: 깊은 공감, 리프레이밍, 위로 메시지

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Date Handling**: date-fns
- **AI API**: Google Gemini 2.0 Flash
- **State Management**: React Hooks
- **Storage**: localStorage

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+ 
- Gemini 2.0 Flash API 키

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd gratitude-gemini-coach

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### API 키 설정
1. [Google AI Studio](https://aistudio.google.com/)에서 Gemini 2.0 Flash API 키 발급
2. 앱에서 "API 키 변경" 버튼 클릭
3. 발급받은 API 키 입력 및 저장

## 📱 사용법

### 일기 작성
1. "일기 작성" 탭에서 날짜 선택
2. 오늘의 감정 선택
3. 3가지 감사 항목 작성 (각 50자 내외)
4. "피드백 받기" 버튼 클릭
5. AI 코치의 맞춤형 피드백 확인

### 일기 관리
- **일기 목록**: "일기 목록" 탭에서 모든 일기 확인
- **일기 수정**: 목록에서 일기 클릭하여 수정
- **일기 삭제**: 일기 작성 화면에서 삭제 버튼 클릭

### 월간 리포트
1. "월간 리포트" 탭 선택
2. 원하는 월 선택
3. 감정 분포, 긍정률, 키워드 분석 확인

## 🎨 디자인 시스템

### 감정 기반 색상
- **행복** 😊 - 밝은 노란색 계열
- **기쁨** 😄 - 따뜻한 주황색 계열
- **뿌듯** 😌 - 성공적인 초록색 계열
- **편안** 😌 - 차분한 파란색 계열
- **피곤** 😴 - 중성적인 회색 계열
- **우울** 😔 - 차분한 보라색 계열

### 애니메이션
- 부드러운 등장 효과
- 감정별 맥박 효과
- 떠다니는 효과

## 📊 데이터 구조

```typescript
interface GratitudeEntry {
  id: string;
  date: string;
  self: string;        // 나에 대한 감사
  others: string;      // 타인에 대한 감사
  situation: string;   // 상황에 대한 감사
  emotion: Emotion;    // 감정
  feedback: string[];  // AI 피드백
  createdAt: number;   // 생성 시간
}
```

## 🔒 개인정보 보호

- 모든 데이터는 사용자의 브라우저에만 저장됩니다
- API 키는 로컬 스토리지에 암호화되지 않은 상태로 저장됩니다
- 서버로 데이터가 전송되지 않습니다

## 🚧 개발 계획

### 완료된 기능 ✅
- 기본 감사일기 작성
- 감정별 AI 피드백
- 일기 저장 및 목록
- 월간 감정 리포트
- 키워드 분석

### 향후 계획 🔄
- 데이터 백업/복원 기능
- 감정 트렌드 차트
- 소셜 공유 기능
- 모바일 앱 개발

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**감사일기와 함께 매일의 작은 감사를 기록하고, 더 나은 정서적 웰빙을 경험해보세요! 💝**
