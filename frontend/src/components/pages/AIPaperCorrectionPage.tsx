import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, AlertTriangle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '@/store/useAppStore';

const API_BASE = 'http://localhost:8000/api/v1';

function getAuthHeaders(extra?: Record<string, string>) {
  const token = localStorage.getItem('auth_token') || 'mock-demo-token-for-school-erp';
  return {
    ...(extra ?? {}),
    Authorization: 'Bearer ' + token,
  };
}

function isAllowedDocumentFile(file: File | null) {
  if (!file) return false;
  const lowerName = file.name.toLowerCase();
  const mimeType = (file.type || '').toLowerCase();
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'];
  if (allowedExtensions.some((ext) => lowerName.endsWith(ext))) return true;
  if (mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType === 'application/octet-stream') return true;
  return false;
}

export default function AIPaperCorrectionPage() {
  const students = useAppStore(s => s.students);
  const classes = useAppStore(s => s.classes);
  const subjects = useAppStore(s => s.subjects);
  const loadStudents = useAppStore(s => s.loadStudents);
  const loadClasses = useAppStore(s => s.loadClasses);
  const loadSubjects = useAppStore(s => s.loadSubjects);

  useEffect(() => {
    loadStudents();
    loadClasses();
    loadSubjects();
  }, [loadStudents, loadClasses, loadSubjects]);

  const classOptions = useMemo(() => {
    if (classes.length) return classes;
    return [
      { id: 'grade-8-a', name: 'Grade 8', grade: 8, section: 'A', subjects: ['Mathematics'] },
      { id: 'grade-9-a', name: 'Grade 9', grade: 9, section: 'A', subjects: ['Science'] },
      { id: 'grade-10-a', name: 'Grade 10', grade: 10, section: 'A', subjects: ['Mathematics'] },
    ] as any[];
  }, [classes]);

  const subjectOptions = useMemo(() => {
    if (subjects.length) return subjects;
    return [
      { id: 'sub-maths', name: 'Mathematics', code: 'MATH', teacherName: 'Teacher', classes: ['Grade 8'] },
      { id: 'sub-science', name: 'Science', code: 'SCI', teacherName: 'Teacher', classes: ['Grade 9'] },
      { id: 'sub-english', name: 'English', code: 'ENG', teacherName: 'Teacher', classes: ['Grade 10'] },
    ] as any[];
  }, [subjects]);

  const studentOptions = useMemo(() => {
    if (students.length) return students;
    return [
      { id: 's1', studentId: 'STU-1001', name: 'Arun Kumar', className: 'Grade 8', section: 'A' },
      { id: 's2', studentId: 'STU-1002', name: 'Priya Nair', className: 'Grade 8', section: 'A' },
      { id: 's3', studentId: 'STU-1003', name: 'Rohan Iyer', className: 'Grade 9', section: 'A' },
    ] as any[];
  }, [students]);

  const [examName, setExamName] = useState('Unit Test 1');
  const [className, setClassName] = useState('Grade 8');
  const [subject, setSubject] = useState('Mathematics');
  const [totalMarks, setTotalMarks] = useState(20);
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [studentPaperFile, setStudentPaperFile] = useState<File | null>(null);
  const [studentId, setStudentId] = useState('STU-1001');
  const [studentName, setStudentName] = useState('Arun Kumar');
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, { teacher_marks: number; teacher_comments: string }>>({});

  useEffect(() => {
    if (classOptions.length > 0 && !classOptions.some(option => option.name === className)) {
      setClassName(classOptions[0].name);
    }
  }, [classOptions, className]);

  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.some(option => option.name === subject)) {
      setSubject(subjectOptions[0].name);
    }
  }, [subjectOptions, subject]);

  useEffect(() => {
    if (!studentOptions.length) return;
    const firstStudent = studentOptions[0];
    if (!studentOptions.some(student => student.studentId === studentId)) {
      setStudentId(firstStudent.studentId);
      setStudentName(firstStudent.name);
    }
  }, [studentId, studentOptions]);

  const selectedStudent = studentOptions.find(student => student.studentId === studentId || student.name === studentName) || studentOptions[0];
  const selectedClassSection = selectedStudent ? `${selectedStudent.className}${selectedStudent.section ? ` - ${selectedStudent.section}` : ''}` : className;
  const [examId, setExamId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [submissionId, setSubmissionId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const totalAwarded = useMemo(() => results.reduce((sum, item) => sum + Number(item.awarded_marks || 0), 0), [results]);

  async function loadExams() {
    try {
      const res = await fetch(`${API_BASE}/paper-correction/exams`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Unable to load exams');
      setExams(Array.isArray(data) ? data : []);
      if (data.length && !selectedExamId) {
        setSelectedExamId(data[0].id);
        setExamId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  async function handleCreateExam() {
    try {
      setLoading(true);
      const normalizedClass = className.trim();
      const res = await fetch(`${API_BASE}/paper-correction/exams`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          exam_name: examName,
          class_name: normalizedClass,
          section: '',
          subject,
          total_marks: Number(totalMarks),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Exam creation failed');
      const createdExam = { ...data, id: data.id || data._id };
      setExamId(createdExam.id);
      setSelectedExamId(createdExam.id);
      setExams(prev => [createdExam, ...prev]);
      toast.success('Exam created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Unable to create exam');
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadQuestionPaper() {
    const targetExamId = selectedExamId || examId;
    if (!targetExamId || !questionPaperFile) {
      toast.error('Create an exam and choose a question paper file first');
      return;
    }
    if (!isAllowedDocumentFile(questionPaperFile)) {
      toast.error('Only PDF or image files are allowed for the question paper.');
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append('file', questionPaperFile);
      form.append('exam_id', targetExamId);
      const res = await fetch(`${API_BASE}/paper-correction/question-paper`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Question paper upload failed');
      setExams(prev => prev.map(exam => exam.id === targetExamId ? { ...exam, questionPaper: data } : exam));
      toast.success('Question paper uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Question paper upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadAnswerKey() {
    const targetExamId = selectedExamId || examId;
    if (!targetExamId || !answerKeyFile) {
      toast.error('Create an exam and choose an answer key file first');
      return;
    }
    if (!isAllowedDocumentFile(answerKeyFile)) {
      toast.error('Only PDF or image files are allowed for the answer key.');
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append('file', answerKeyFile);
      form.append('exam_id', targetExamId);
      form.append('rubric', JSON.stringify([]));
      const res = await fetch(`${API_BASE}/paper-correction/answer-key`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Answer key upload failed');
      setExams(prev => prev.map(exam => exam.id === targetExamId ? { ...exam, answerKey: data } : exam));
      toast.success('Answer key uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Answer key upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentPaperUpload() {
    const targetExamId = selectedExamId || examId;
    if (!targetExamId || !studentPaperFile) {
      toast.error('Create an exam and upload a student answer sheet');
      return;
    }
    if (!isAllowedDocumentFile(studentPaperFile)) {
      toast.error('Only PDF or image files are allowed for answer sheets.');
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append('file', studentPaperFile);
      form.append('exam_id', targetExamId);
      form.append('student_id', studentId);
      form.append('student_name', studentName);
      form.append('class_name', selectedStudent?.className || className);
      form.append('section', selectedStudent?.section || 'A');
      form.append('subject', subject);
      const res = await fetch(`${API_BASE}/paper-correction/student-paper`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Student paper upload failed');
      setSubmissionId(data.id);
      const resultRes = await fetch(`${API_BASE}/paper-correction/${data.id}/result`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const resultData = await resultRes.json();
      if (resultRes.ok && resultData && Array.isArray(resultData.evaluations)) {
        setResults(resultData.evaluations);
      }
      toast.success('Student paper uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Student paper upload failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuestionReview(item: any) {
    if (!submissionId) return;
    const draft = reviewDrafts[item.question_no] ?? {
      teacher_marks: Number(item.teacher_marks ?? item.awarded_marks ?? 0),
      teacher_comments: item.teacher_comments ?? '',
    };

    try {
      setLoading(true);
      const payload = {
        teacher_marks: Number(draft.teacher_marks),
        teacher_comments: draft.teacher_comments,
        status: Number(draft.teacher_marks) < Number(item.maximum_marks) ? 'TEACHER_REVIEW' : 'APPROVED',
      };
      const res = await fetch(`${API_BASE}/paper-correction/${submissionId}/question/${item.question_no}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Teacher review failed');
      setResults((prev) => prev.map((row) => row.question_no === item.question_no ? { ...row, teacher_marks: payload.teacher_marks, teacher_comments: payload.teacher_comments, status: payload.status, final_marks: payload.teacher_marks } : row));
      toast.success(`Question ${item.question_no} review saved`);
    } catch (error: any) {
      toast.error(error.message || 'Teacher review failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveSubmission() {
    if (!submissionId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/paper-correction/${submissionId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Approval failed');
      setSummary((prev: any) => ({ ...(prev || {}), status: 'APPROVED' }));
      toast.success('Submission approved');
    } catch (error: any) {
      toast.error(error.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate() {
    if (!submissionId) {
      toast.error('Upload a student answer sheet first');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/paper-correction/${submissionId}/evaluate`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'AI evaluation failed');
      setResults(data.results || []);
      setSummary(data.summary || null);
      toast.success('AI evaluation completed');
    } catch (error: any) {
      toast.error(error.message || 'AI evaluation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BrainCircuit size={22} className="text-primary" /> AI Paper Correction</h1>
          <p className="text-sm text-muted-foreground">Teacher dashboard for exam creation, answer-key upload, student answer review, and AI-based evaluation.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <Sparkles size={12} /> Semantic grading pipeline
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold">A. Create Exam</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Exam Title</span>
              <input value={examName} onChange={e => setExamName(e.target.value)} placeholder="Enter exam title" className="input-style" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Class / Grade</span>
              <select value={className} onChange={e => setClassName(e.target.value)} className="input-style">
                {classOptions.map(option => (
                  <option key={option.id ?? option.name} value={option.name}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Subject</span>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="input-style">
                {subjectOptions.map(option => (
                  <option key={option.id ?? option.name} value={option.name}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Total Marks</span>
              <input type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} placeholder="Total marks" className="input-style" />
            </label>
          </div>
          <button onClick={handleCreateExam} disabled={loading} className="btn-primary w-full">Create Exam</button>
          {examId && <div className="text-xs text-muted-foreground">Created exam ID: {examId}</div>}
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Active exam</span>
            <select value={selectedExamId || examId} onChange={e => {
              setSelectedExamId(e.target.value);
              setExamId(e.target.value);
            }} className="input-style">
              {exams.length === 0 && <option value={examId || ''}>{examId ? 'Current exam' : 'No exam yet'}</option>}
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.exam_name || 'Untitled exam'} • {exam.subject || 'Subject'}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-semibold">B. Upload Question Paper / Answer Key / Student Sheet</h2>
          <label className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Question paper</span>
            <input type="file" onChange={e => setQuestionPaperFile(e.target.files?.[0] ?? null)} className="text-xs" />
          </label>
          <button onClick={handleUploadQuestionPaper} className="btn-secondary w-full">Upload Question Paper</button>

          <label className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Answer key</span>
            <input type="file" onChange={e => setAnswerKeyFile(e.target.files?.[0] ?? null)} className="text-xs" />
          </label>
          <button onClick={handleUploadAnswerKey} className="btn-secondary w-full">Upload Answer Key</button>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Student ID</span>
              <select value={studentId} onChange={e => {
                const next = studentOptions.find(student => student.studentId === e.target.value);
                setStudentId(e.target.value);
                if (next) setStudentName(next.name);
              }} className="input-style">
                {studentOptions.map(student => (
                  <option key={student.id ?? student.studentId} value={student.studentId}>{student.studentId}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Student Name</span>
              <select value={studentName} onChange={e => {
                const next = studentOptions.find(student => student.name === e.target.value);
                setStudentName(e.target.value);
                if (next) setStudentId(next.studentId);
              }} className="input-style">
                {studentOptions.map(student => (
                  <option key={student.id ?? student.name} value={student.name}>{student.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Student answer sheet</span>
            <input type="file" onChange={e => setStudentPaperFile(e.target.files?.[0] ?? null)} className="text-xs" />
          </label>
          <button onClick={handleStudentPaperUpload} className="btn-secondary w-full">Upload Student Paper</button>
          {submissionId && <div className="text-xs text-muted-foreground">Submission ID: {submissionId}</div>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold">C. Exam Register</h2>
        {exams.length === 0 && <div className="text-sm text-muted-foreground">No exam has been created yet.</div>}
        <div className="space-y-3">
          {exams.map(exam => (
            <div key={exam.id} className={`rounded-xl border p-3 ${selectedExamId === exam.id ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{exam.exam_name || 'Untitled exam'}</div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedExamId(exam.id); setExamId(exam.id); setExamName(exam.exam_name || examName); setClassName(exam.class_name || className); setSubject(exam.subject || subject); setTotalMarks(exam.total_marks || totalMarks); }} className="btn-secondary text-xs px-2 py-1">Edit</button>
                  <button onClick={() => {
                    setExams(prev => prev.filter(item => item.id !== exam.id));
                    if (selectedExamId === exam.id) {
                      setSelectedExamId('');
                      setExamId('');
                    }
                  }} className="btn-secondary text-xs px-2 py-1 text-red-600">Delete</button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Class: {exam.class_name || className}</div>
                <div>Subject: {exam.subject || subject}</div>
                <div>Marks: {exam.total_marks || totalMarks}</div>
                <div>Status: {exam.questionPaper && exam.answerKey ? 'Ready' : 'Pending'}</div>
              </div>
              <div className="mt-3 flex gap-2 text-[11px]">
                <span className="rounded-full bg-muted px-2 py-1">Question paper: {exam.questionPaper ? 'Uploaded' : 'Not uploaded'}</span>
                <span className="rounded-full bg-muted px-2 py-1">Answer key: {exam.answerKey ? 'Uploaded' : 'Not uploaded'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">E. Start AI Correction</h2>
          <button onClick={handleEvaluate} disabled={loading || !submissionId} className="btn-primary">Run AI Evaluation</button>
        </div>
        {summary && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Total AI Marks</div>
                <div className="text-lg font-semibold">{summary.total_ai_marks}/{totalMarks}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Average Confidence</div>
                <div className="text-lg font-semibold">{summary.average_confidence}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Teacher Review</div>
                <div className="text-lg font-semibold">{summary.pending_review}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-lg font-semibold">{summary.status}</div>
              </div>
            </div>
            <button onClick={handleApproveSubmission} className="btn-primary">Approve Final Result</button>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">F. Evaluation Dashboard</h2>
        <div className="space-y-3">
          {results.length === 0 && <div className="text-sm text-muted-foreground">No evaluation results yet. Upload a student paper and run AI correction.</div>}
          {results.map((item) => {
            const draft = reviewDrafts[item.question_no] ?? {
              teacher_marks: Number(item.teacher_marks ?? item.awarded_marks ?? 0),
              teacher_comments: item.teacher_comments ?? '',
            };

            return (
              <div key={item.question_no} className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="font-medium">Q{item.question_no}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-muted px-2 py-1 rounded-full">{item.awarded_marks}/{item.maximum_marks} marks</span>
                    <span className="bg-primary/10 px-2 py-1 rounded-full text-primary">{Math.round((item.confidence || 0) * 100)}% confidence</span>
                    {Number(item.confidence || 0) < 0.75 && (
                      <span className="bg-amber-500/15 text-amber-600 px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={12} /> Low AI confidence</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{item.evaluation}</div>
                <div className="text-sm">{item.feedback}</div>
                {item.rubric?.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {item.rubric.map((criterion: any) => (
                      <div key={criterion.criterion} className="flex justify-between border-b border-border pb-1 last:border-0">
                        <span>{criterion.criterion}</span>
                        <span>{criterion.awarded_marks}/{criterion.maximum_marks}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid md:grid-cols-[140px_1fr_auto] gap-2 items-end">
                  <label className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Teacher marks</span>
                    <input
                      type="number"
                      min={0}
                      max={Number(item.maximum_marks || 0)}
                      step="0.5"
                      value={draft.teacher_marks}
                      onChange={(e) => setReviewDrafts((prev) => ({
                        ...prev,
                        [item.question_no]: { ...draft, teacher_marks: Number(e.target.value) },
                      }))}
                      className="input-style"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Teacher comments</span>
                    <input
                      value={draft.teacher_comments}
                      onChange={(e) => setReviewDrafts((prev) => ({
                        ...prev,
                        [item.question_no]: { ...draft, teacher_comments: e.target.value },
                      }))}
                      placeholder="Add review note"
                      className="input-style"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => handleQuestionReview(item)} className="btn-secondary text-xs">Review</button>
                    <button onClick={() => {
                      setReviewDrafts((prev) => ({
                        ...prev,
                        [item.question_no]: { teacher_marks: Number(item.maximum_marks || 0), teacher_comments: draft.teacher_comments || 'Approved after teacher review.' },
                      }));
                      handleQuestionReview({ ...item, teacher_marks: Number(item.maximum_marks || 0), teacher_comments: draft.teacher_comments || 'Approved after teacher review.' });
                    }} className="btn-primary text-xs">Approve</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .input-style {
          width: 100%;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          border-radius: 0.75rem;
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-style:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 1px hsl(var(--ring));
        }
        .btn-primary, .btn-secondary {
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .btn-primary {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .btn-secondary {
          border: 1px solid hsl(var(--border));
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}
