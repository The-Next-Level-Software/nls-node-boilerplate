module.exports = {
    apps: [
        {
            name: "api",
            script: "src/app.js",
            interpreter: "node",
            watch: true
        },
        {
            name: "emailWorker",
            script: "src/workers/email_worker.js",
            interpreter: "node"
        },
    ]
};
