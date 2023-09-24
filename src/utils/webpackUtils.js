'use strict';

const path = require("path");
const fse = require("fs-extra");

/** Перенести файлы из public в dist */
function copyFilesToDist() {
    fse.copySync(path.resolve('public'), path.resolve('dist'));
}


module.exports = {
    copyFilesToDist,
}