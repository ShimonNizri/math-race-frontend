import React from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

function ConfirmModal({isOpen, title = "אזהרה: אישור פעולה", message,
                          confirmText = "כן, אני מאשר",
                          cancelText = "ביטול",
                          onConfirm, onCancel}) {
    if (!isOpen) return null;

    return createPortal(
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-box">
                <h3 className="modal-title">{title}</h3>
                <p className="modal-text">{message}</p>
                <div className="modal-actions">
                    <button className="modal-btn modal-confirm-btn" onClick={onConfirm}>
                        {confirmText}
                    </button>
                    <button className="modal-btn modal-cancel-btn" onClick={onCancel}>
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ConfirmModal;