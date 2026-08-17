import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatFileSize, confidenceColor, confidenceBg, formatDateTime } from '@/lib/utils';
import {
  Brain, Upload, CheckCircle2, XCircle, Clock, FileText, AlertTriangle,
  Check, X, RefreshCw, Eye, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentAiService } from '@/services/aiService';
import type { DocumentRecord, ExtractedField } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  uploaded: { label: 'Uploaded', color: 'bg-muted text-muted-foreground', icon: <Upload size={10} /> },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400', icon: <Loader2 size={10} className="animate-spin" /> },
  extracted: { label: 'Extracted', color: 'bg-violet-100 text-violet-700', icon: <Brain size={10} /> },
  pending_approval: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400', icon: <Clock size={10} /> },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400', icon: <CheckCircle2 size={10} /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400', icon: <XCircle size={10} /> },
};

export default function DocumentAIPage() {
  const documents = useAppStore(s => s.documents);
  const addDocument = useAppStore(s => s.addDocument);
  const updateDocument = useAppStore(s => s.updateDocument);
  const approveDocument = useAppStore(s => s.approveDocument);
  const rejectDocument = useAppStore(s => s.rejectDocument);

  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [editedFields, setEditedFields] = useState<ExtractedField[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File exceeds 10 MB limit'); return; }

    setUploading(true);
    const docId = `doc-${Date.now()}`;
    const newDoc: DocumentRecord = {
      id: docId, fileName: file.name, fileType: file.type, fileSize: file.size,
      documentType: 'admission_form', status: 'processing',
      uploadedAt: new Date().toISOString(), uploadedBy: 'Admin', extractedFields: [],
    };
    addDocument(newDoc);
    toast('Processing document…', { icon: '⚙️' });

    try {
      const result = await documentAiService.extractDocument(file);
      updateDocument(docId, {
        status: 'pending_approval',
        extractedFields: result.fields,
        processedAt: new Date().toISOString(),
        documentType: result.documentType,
      });
      toast.success(`Extraction complete — avg confidence: ${result.averageConfidence}%`);
    } catch {
      updateDocument(docId, { status: 'rejected', rejectionReason: 'Processing failed' });
      toast.error('Document processing failed');
    }
    setUploading(false);
  }, [addDocument, updateDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': [], 'image/jpeg': [], 'image/png': [] }, maxFiles: 1
  });

  function openReview(doc: DocumentRecord) {
    setSelectedDoc(doc);
    setEditedFields(doc.extractedFields.map(f => ({ ...f })));
  }

  async function handleApprove() {
    if (!selectedDoc) return;
    await approveDocument(selectedDoc.id, editedFields);
    toast.success('Document approved — record created');
    setSelectedDoc(null);
  }

  function handleReject() {
    if (!selectedDoc || !rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    rejectDocument(selectedDoc.id, rejectReason);
    toast.success('Document rejected');
    setSelectedDoc(null);
    setShowReject(false);
    setRejectReason('');
  }

  const pending = documents.filter(d => d.status === 'pending_approval').length;
  const approved = documents.filter(d => d.status === 'approved').length;
  const rejected = documents.filter(d => d.status === 'rejected').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Brain size={20} className="text-primary" /> Document AI</h1>
        <p className="text-sm text-muted-foreground">Upload school documents for automatic AI extraction</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{pending}</div>
          <div className="text-xs text-muted-foreground">Pending Review</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{approved}</div>
          <div className="text-xs text-muted-foreground">Approved</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{rejected}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 size={32} className="text-primary animate-spin" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload size={20} className="text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{uploading ? 'Processing…' : isDragActive ? 'Drop to upload' : 'Drag & drop or click to upload'}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG · Max 10 MB</p>
          </div>
          {!uploading && (
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {['Admission Form', 'Transfer Certificate', 'Teacher Form', 'Attendance Sheet'].map(t => (
                <span key={t} className="px-2 py-0.5 bg-muted rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI pipeline visual */}
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {['Upload', 'Processing', 'AI Extraction', 'Validation', 'Admin Approval', 'ERP Database'].map((step, i, arr) => (
          <div key={step} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{i+1}</div>
              <div className="text-[10px] text-muted-foreground whitespace-nowrap">{step}</div>
            </div>
            {i < arr.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">{doc.fileName}</span>
                <span className={cn('flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium', STATUS_CONFIG[doc.status].color)}>
                  {STATUS_CONFIG[doc.status].icon} {STATUS_CONFIG[doc.status].label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {doc.documentType.replace(/_/g, ' ')} · {formatFileSize(doc.fileSize)} · {formatDateTime(doc.uploadedAt)}
              </div>
              {doc.rejectionReason && (
                <div className="text-xs text-red-600 mt-0.5 flex items-center gap-1"><AlertTriangle size={10} />{doc.rejectionReason}</div>
              )}
              {doc.extractedFields.length > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {doc.extractedFields.length} fields extracted · avg confidence: {Math.round(doc.extractedFields.reduce((a, f) => a + f.confidence, 0) / doc.extractedFields.length)}%
                </div>
              )}
            </div>
            {doc.status === 'pending_approval' && (
              <button
                onClick={() => openReview(doc)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex-shrink-0"
              >
                <Eye size={11} /> Review
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Review modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="font-semibold text-sm">{selectedDoc.fileName}</h2>
                <p className="text-xs text-muted-foreground capitalize">{selectedDoc.documentType.replace(/_/g,' ')}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {editedFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No fields extracted — document may be unreadable</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> ≥90% High confidence
                    <div className="w-2 h-2 rounded-full bg-amber-500 ml-2" /> 80–89% Medium
                    <div className="w-2 h-2 rounded-full bg-red-500 ml-2" /> &lt;80% Low — review required
                  </div>
                  {editedFields.map((field, idx) => (
                    <div key={field.key} className={cn('p-3 rounded-lg', confidenceBg(field.confidence))}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                        <div className="flex items-center gap-1">
                          {field.isLowConfidence && <AlertTriangle size={10} className="text-red-500" />}
                          <span className={cn('text-xs font-medium', confidenceColor(field.confidence))}>
                            {field.confidence}%
                          </span>
                        </div>
                      </div>
                      <input
                        value={field.value}
                        onChange={e => setEditedFields(prev => prev.map((f, i) => i === idx ? { ...f, value: e.target.value, isEdited: true } : f))}
                        className="w-full h-7 px-2 text-sm rounded border border-input bg-background/80 focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {field.isEdited && <div className="text-[10px] text-amber-600 mt-1">Manually edited</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4 border-t border-border flex-shrink-0">
              <div>
                {!showReject ? (
                  <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10">
                    <XCircle size={11} /> Reject
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection"
                      className="h-7 px-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring w-44" />
                    <button onClick={handleReject} className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded">Confirm</button>
                    <button onClick={() => setShowReject(false)} className="text-xs text-muted-foreground">Cancel</button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedDoc(null)} className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted">Close</button>
                <button onClick={handleApprove} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Check size={11} /> Approve & Create Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
