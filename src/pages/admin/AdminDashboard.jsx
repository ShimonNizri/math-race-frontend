import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    fetchQuestionReports,
    fetchTemplateById,
    debugTemplateWithAI,
    testTemplate,
    updateReportStatus,
    updateTemplate
} from '../../services/adminService';
import { ClipLoader } from 'react-spinners';
import './AdminDashboard.css';

const REPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function AdminDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentStatus = searchParams.get('status') || 'OPEN';
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);

    const [selectedReport, setSelectedReport] = useState(null);
    const [originalTemplate, setOriginalTemplate] = useState(null);
    const [editStatus, setEditStatus] = useState("");

    const [editForm, setEditForm] = useState({
        questionTemplate: "",
        answerTemplate: "",
        hintTemplate: "",
        distractor1: "",
        distractor2: "",
        distractor3: ""
    });

    const [aiResponse, setAiResponse] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const [testOutput, setTestOutput] = useState(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 4000);
    };

    const loadReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchQuestionReports(page, 10, currentStatus);
            setReports(data?.data || (Array.isArray(data) ? data : []));
        } catch (err) {
            setError("Failed to fetch reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
        setSelectedReport(null);
    }, [currentStatus, page]);

    const handleReportClick = async (report) => {
        setSelectedReport(report);
        setEditStatus(report.status);
        setAiResponse(null);
        setTestOutput(null);
        setOriginalTemplate(null);

        try {
            const response = await fetchTemplateById(report.templateId);
            const templateData = response.data || response;

            setOriginalTemplate(templateData);
            setEditForm({
                questionTemplate: templateData.questionTemplate || "",
                answerTemplate: templateData.answerTemplate || "",
                hintTemplate: templateData.hintTemplate || "",
                distractor1: templateData.distractor1 || "",
                distractor2: templateData.distractor2 || "",
                distractor3: templateData.distractor3 || ""
            });
        } catch (err) {
            console.error("Failed to load template:", err);
            setOriginalTemplate({ error: "Could not load template from database." });
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAiDebug = async () => {
        if (!selectedReport) return;
        setIsAiLoading(true);
        try {
            const response = await debugTemplateWithAI(selectedReport.id);
            setAiResponse(response?.data || response.message || JSON.stringify(response));
        } catch (err) {
            setAiResponse("AI Analysis failed. Check console.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleTestRun = async () => {
        if (!editForm.questionTemplate.trim()) return;
        setIsTesting(true);
        setTestOutput(null);
        try {
            const result = await testTemplate(editForm);
            setTestOutput(result.data || result);
        } catch (err) {
            setTestOutput({
                hasErrors: true,
                errors: [err.response?.data?.message || err.message]
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSaveTemplate = async () => {
        setIsSaving(true);
        try {
            if (editStatus !== selectedReport.status) {
                await updateReportStatus(selectedReport.id, editStatus);
            }
            await updateTemplate(selectedReport.templateId, editForm);

            showToast("Changes saved successfully!", "success");
            setSelectedReport(null);
            loadReports();
        } catch (err) {
            showToast("Failed to save changes. Check console.", "error");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTabChange = (status) => {
        setSearchParams({ status });
        setPage(0);
    };

    const getStatusColorClass = (status) => {
        switch(status) {
            case 'OPEN': return 'theme-blue';
            case 'IN_PROGRESS': return 'theme-yellow';
            case 'RESOLVED': return 'theme-green';
            case 'REJECTED': return 'theme-red';
            default: return '';
        }
    };

    if (selectedReport) {
        return (
            <div className="admin-dashboard detail-view">
                <div className={`toast-notification ${toast.type} ${toast.show ? 'show' : ''}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>

                <div className="dashboard-header-row">
                    <div className="header-navigation-gap">
                        <button className="btn-home" onClick={() => navigate('/')}>
                            🏠 Home
                        </button>
                        <button className="btn-back" onClick={() => setSelectedReport(null)}>
                            ← Back to Reports
                        </button>
                    </div>
                    <div className="header-actions">
                        <span className={`status-badge large ${getStatusColorClass(selectedReport.status)}`}>
                            {selectedReport.status}
                        </span>
                    </div>
                </div>

                <div className="detail-split-layout">
                    <div className="detail-pane info-pane">
                        <h2 className="pane-title">📋 Report Information</h2>
                        <div className="info-card">
                            <div className="info-header">
                                <h3>Report ID: {selectedReport.id}</h3>
                            </div>
                            <div className="info-list">
                                <div className="info-row half-width">
                                    <span className="info-label">Template ID:</span>
                                    <span className="info-value">{selectedReport.templateId}</span>
                                </div>
                                <div className="info-row half-width">
                                    <span className="info-label">Reporter</span>
                                    <span className="info-value">{selectedReport.reporterType}</span>
                                </div>
                                <div className="info-row full-width highlight-row">
                                    <span className="info-label">User Comment</span>
                                    <span className="info-value">{selectedReport.userComment || 'No comment'}</span>
                                </div>

                                <div className="info-row full-width">
                                    <span className="info-label">Generated Question (Expression)</span>
                                    <code className="info-code">{selectedReport.expression || 'N/A'}</code>
                                </div>

                                <div className="info-row full-width">
                                    <span className="info-label">Generated Options (Answers)</span>
                                    <div className="options-badges">
                                        {selectedReport.options ? (
                                            selectedReport.options.replace(/[\[\]"]/g, '').split(',').map((opt, i) => (
                                                <span key={i} className="opt-badge">{opt.trim()}</span>
                                            ))
                                        ) : (
                                            <span className="no-comment">No options logged</span>
                                        )}
                                    </div>
                                </div>

                                <div className="info-row full-width">
                                    <span className="info-label">Generated Hint</span>
                                    <span className="info-value">
                                        {selectedReport.hint ? selectedReport.hint : <span className="no-comment">No hint logged</span>}
                                    </span>
                                </div>
                            </div>

                            <div className="error-section">
                                <h4>System Errors</h4>
                                <pre className="error-block scrollable-block">{selectedReport.errors || 'None'}</pre>
                            </div>

                            <div className="memory-section">
                                <h4>Tag Memory (JSON)</h4>
                                <pre className="scrollable-block">{selectedReport.tagMemoryJson}</pre>
                            </div>
                        </div>
                    </div>

                    <div className="detail-pane editor-pane">
                        <h2 className="pane-title">🛠️ Edit & Debug Workspace</h2>

                        <div className="editor-card">
                            <button className="btn-ai" onClick={handleAiDebug} disabled={isAiLoading}>
                                ✨ {isAiLoading ? "Analyzing..." : "Analyze Report with AI"}
                            </button>

                            {aiResponse && (
                                <div className="ai-response-box fade-in">
                                    <div className="ai-header">🤖 AI Analysis</div>
                                    <p>{aiResponse}</p>
                                </div>
                            )}

                            <div className="editor-section">
                                <div className="editor-header-action">
                                    <h4>Template Editor</h4>
                                    <button className="btn-run" onClick={handleTestRun} disabled={isTesting}>
                                        ▶ {isTesting ? 'Running...' : 'Run & Test'}
                                    </button>
                                </div>

                                <div className="edit-form-grid">
                                    <div className="form-group full-width">
                                        <label>Question Template</label>
                                        <textarea name="questionTemplate" rows="5" value={editForm.questionTemplate} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-group half-width">
                                        <label>Answer Template</label>
                                        <textarea name="answerTemplate" rows="3" value={editForm.answerTemplate} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-group half-width">
                                        <label>Hint Template</label>
                                        <textarea name="hintTemplate" rows="3" value={editForm.hintTemplate} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-group third-width">
                                        <label>Distractor 1</label>
                                        <textarea name="distractor1" rows="3" value={editForm.distractor1} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-group third-width">
                                        <label>Distractor 2</label>
                                        <textarea name="distractor2" rows="3" value={editForm.distractor2} onChange={handleFormChange} />
                                    </div>
                                    <div className="form-group third-width">
                                        <label>Distractor 3</label>
                                        <textarea name="distractor3" rows="3" value={editForm.distractor3} onChange={handleFormChange} />
                                    </div>
                                </div>
                            </div>

                            {testOutput && (
                                <div className={`test-output-section fade-in`}>
                                    <h4>Test Output Results</h4>
                                    <div className={`test-results-box ${testOutput.hasErrors ? 'has-error' : 'is-success'}`}>

                                        {testOutput.hasErrors && testOutput.errors && testOutput.errors.length > 0 && (
                                            <div className="errors-box">
                                                <h5>⚠️ Compilation Errors:</h5>
                                                <ul>
                                                    {testOutput.errors.map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {(testOutput.expression || testOutput.options?.length > 0) && (
                                            <div className="success-box" style={{ marginTop: testOutput.hasErrors ? '16px' : '0' }}>
                                                <div className="result-row"><span className="lbl">Q:</span> {testOutput.expression || 'N/A'}</div>
                                                <div className="result-row"><span className="lbl">Hint:</span> {testOutput.hint || 'N/A'}</div>
                                                <div className="result-row options-row">
                                                    <span className="lbl">Options:</span>
                                                    <div className="options-badges">
                                                        {testOutput.options && testOutput.options.length > 0
                                                            ? testOutput.options.map((opt, i) => {
                                                                const isCorrect = String(opt).trim() === String(testOutput.correctAnswer).trim();
                                                                return (
                                                                    <span key={i} className={`opt-badge ${isCorrect ? 'correct-opt' : ''}`}>
                                                                        {opt}
                                                                    </span>
                                                                );
                                                            })
                                                            : <span className="no-comment">No options</span>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}

                            <hr className="divider" />

                            <div className="action-row">
                                <div className="status-updater">
                                    <label>Status</label>
                                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                                        {REPORT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <button className="btn-submit" onClick={handleSaveTemplate} disabled={isSaving}>
                                    💾 {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className={`toast-notification ${toast.type} ${toast.show ? 'show' : ''}`}>
                {toast.type === 'success' ? '✅' : '❌'} {toast.message}
            </div>

            <button className="btn-home" onClick={() => navigate('/')}>
                🏠 Home
            </button>

            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <p className="subtitle">Monitor, debug, and resolve template generation issues efficiently.</p>
            </div>

            <div className="dashboard-controls">
                <div className="tabs-container">
                    {REPORT_STATUSES.map(status => (
                        <button
                            key={status}
                            className={`tab-btn ${currentStatus === status ? 'active' : ''}`}
                            onClick={() => handleTabChange(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="actions-container">
                    <button className="btn-refresh" onClick={loadReports} disabled={loading}>
                        🔄 Refresh Data
                    </button>
                </div>
            </div>

            <div className="reports-grid">
                {loading ? (
                    <div className="loader-container">
                        <ClipLoader color="var(--accent)" size={40} />
                        <p>Fetching reports...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Connection Error</h3>
                        <p>{error}</p>
                        <button className="btn-refresh" onClick={loadReports}>Try Again</button>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">✨</div>
                        <h3>All Clear!</h3>
                        <p>No reports found for the <strong>{currentStatus}</strong> status.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id || Math.random()} className={`report-card ${getStatusColorClass(report.status)}`} onClick={() => handleReportClick(report)}>
                            <div className="card-header">
                                <h3>{report.templateId || 'Unknown Template'}</h3>
                                <span className={`status-dot ${getStatusColorClass(report.status)}`}></span>
                            </div>
                            <div className="card-body">
                                <p className="card-info"><strong>Reporter:</strong> {report.reporterType}</p>
                                <div className="card-comment">
                                    {report.userComment ? `"${report.userComment}"` : <span className="no-comment">No comment provided</span>}
                                </div>
                            </div>
                            <div className="card-footer">
                                <span className="view-btn">Review Details →</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!loading && !error && reports.length > 0 && (
                <div className="pagination-container">
                    <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                    <span className="page-indicator">Page {page + 1}</span>
                    <button disabled={reports.length < 10} onClick={() => setPage(page + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}