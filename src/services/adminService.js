import {apiWithAdminToken, apiWithToken} from "../api/axios";

const generateAdminToken = async () => {
    const response = await apiWithToken.post('/admin/token');
    return response.data;
}

const fetchQuestionReports = async (page = 0, size = 10, status = null) => {
    const response = await apiWithAdminToken.get('/admin/question-reports', {
        params: { page, size, status }
    });
    return response.data;
}

const fetchTemplateById = async (templateId) => {
    const response = await apiWithAdminToken.get(`/admin/templates/${templateId}`);
    return response.data;
}

const debugTemplateWithAI = async (reportId) => {
    const response = await apiWithAdminToken.post(`/admin/question-reports/${reportId}/debug-ai`);
    return response.data;
}

const testTemplate = async (templateData) => {
    const response = await apiWithAdminToken.post('/admin/templates/test', templateData);
    return response.data;
}

const updateReportStatus = async (reportId, newStatus) => {
    const response = await apiWithAdminToken.patch(`/admin/question-reports/${reportId}/status`, null, {
        params: { status: newStatus }
    });
    return response.data;
}

const updateTemplate = async (templateId, updatedData) => {
    const response = await apiWithAdminToken.put(`/admin/templates/${templateId}`, updatedData);
    return response.data;
}

export {
    generateAdminToken,
    fetchQuestionReports,
    fetchTemplateById,
    debugTemplateWithAI,
    testTemplate,
    updateReportStatus,
    updateTemplate
};