
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Layout } from './components/Layout';
import { KahootLoader } from './components/KahootLoader';
import { LandingPage } from './pages/LandingPage';

const Dashboard = lazy(() => import('./pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const CreateQuiz = lazy(() => import('./pages/CreateQuiz').then(({ CreateQuiz }) => ({ default: CreateQuiz })));
const EditorPage = lazy(() => import('./pages/EditorPage').then(({ EditorPage }) => ({ default: EditorPage })));
const PublishQuizPage = lazy(() => import('./pages/PublishQuizPage').then(({ PublishQuizPage }) => ({ default: PublishQuizPage })));
const StudentQuizPage = lazy(() => import('./pages/StudentQuizPage').then(({ StudentQuizPage }) => ({ default: StudentQuizPage })));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage').then(({ StatisticsPage }) => ({ default: StatisticsPage })));
const ResultsPage = lazy(() => import('./pages/ResultsPage').then(({ ResultsPage }) => ({ default: ResultsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(({ SettingsPage }) => ({ default: SettingsPage })));
const QuizReportPage = lazy(() => import('./pages/QuizReportPage').then(({ QuizReportPage }) => ({ default: QuizReportPage })));
const DocumentManagementPage = lazy(() => import('./pages/DocumentManagementPage').then(({ DocumentManagementPage }) => ({ default: DocumentManagementPage })));
const ExamManagementPage = lazy(() => import('./pages/ExamManagementPage').then(({ ExamManagementPage }) => ({ default: ExamManagementPage })));
const DocumentViewerPage = lazy(() => import('./pages/DocumentViewerPage').then(({ DocumentViewerPage }) => ({ default: DocumentViewerPage })));
const LibraryPage = lazy(() => import('./pages/LibraryPage').then(({ LibraryPage }) => ({ default: LibraryPage })));
const LibraryShareViewerPage = lazy(() => import('./pages/LibraryShareViewerPage').then(({ LibraryShareViewerPage }) => ({ default: LibraryShareViewerPage })));
const ShuffleExamPage = lazy(() => import('./pages/ShuffleExamPage').then(({ ShuffleExamPage }) => ({ default: ShuffleExamPage })));
const WikiLayout = lazy(() => import('./pages/wiki/WikiLayout').then(({ WikiLayout }) => ({ default: WikiLayout })));
const WikiHome = lazy(() => import('./pages/wiki/WikiHome').then(({ WikiHome }) => ({ default: WikiHome })));
const WikiArticle = lazy(() => import('./pages/wiki/WikiArticle').then(({ WikiArticle }) => ({ default: WikiArticle })));
const WikiSearch = lazy(() => import('./pages/wiki/WikiSearch').then(({ WikiSearch }) => ({ default: WikiSearch })));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<KahootLoader fullscreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/wiki" element={<WikiLayout />}>
            <Route index element={<WikiHome />} />
            <Route path="search" element={<WikiSearch />} />
            <Route path="article/:id" element={<WikiArticle />} />
            <Route path="*" element={<WikiArticle />} />
          </Route>
        
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="create" element={<CreateQuiz />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="documents" element={<DocumentManagementPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="quizzes" element={<ExamManagementPage />} />
            <Route path="shuffle" element={<ShuffleExamPage />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full px-3 py-20 text-center text-[var(--color-text-secondary)]">
                <h2 className="text-xl font-bold mb-2">Tính năng đang phát triển</h2>
                <p>Xin lỗi, chức năng này đang được chúng tôi hoàn thiện và sẽ sớm ra mắt!</p>
              </div>
            } />
          </Route>
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/publish/:id" element={<PublishQuizPage />} />
          <Route path="/report/:id" element={<QuizReportPage />} />
          <Route path="/test/:id" element={<StudentQuizPage />} />
          <Route path="/share/document/:token" element={<DocumentViewerPage />} />
          <Route path="/share/library/:token" element={<LibraryShareViewerPage />} />
          <Route path="/create" element={<Navigate to="/dashboard/create" replace />} />
          <Route path="*" element={
            <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--color-background)] px-4 text-center text-[var(--color-text-secondary)]">
              <h2 className="text-2xl font-bold mb-2">Trang không tồn tại (404)</h2>
              <p className="mb-4">Xin lỗi, đường dẫn bạn đang tìm kiếm không tồn tại.</p>
              <Link to="/" className="text-blue-500 hover:underline">Quay về trang chủ</Link>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
