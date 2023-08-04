'use strict';

import * as React from 'react';
import { createRoot } from "react-dom/client";

import App from "./components/App/App";

const rootHTMLElement = document.createElement('div');
rootHTMLElement.setAttribute('id', 'root');

document.body.appendChild(rootHTMLElement);

const root = createRoot(rootHTMLElement);

root.render(<App />);
