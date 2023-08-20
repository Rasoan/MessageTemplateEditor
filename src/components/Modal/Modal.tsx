'use strict';

import * as React from "react";

import "./Modal.scss";

interface ModalProps {
    isShowing: boolean;
    close: () => void;
    component: React.ReactNode;
}

const Modal: React.FC<ModalProps> = (props) => {
    const {
        component,
        close,
        isShowing
    } = props;

    return <>
        <div className="modal-overlay"/>
        <div className="modal-wrapper" aria-modal aria-hidden tabIndex={-1} role="dialog">
            <div className="modal">
                <div className="modal-header">
                    <button
                        type="button"
                        className="modal-close-button"
                        data-dismiss="modal"
                        aria-label="Close"
                        onClick={close}
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div
                    className={'modal-content'}
                >
                    {component}
                </div>
            </div>
        </div>
    </>
}

export default Modal;