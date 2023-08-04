module.exports = {
    "roots": [
        "<rootDir>/src"
    ],
    "testMatch": [
        "**/spec/**/*.+(ts|tsx|js)",
        "**/__spec.(ts|tsx|js)",
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
}