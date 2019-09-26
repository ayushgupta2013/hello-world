const assert = require('assert');

function sendPasswordChangeEmail({username, email, otp}) {
    assert.ok(username);assert.ok(email);assert.ok(otp);   
    const body = `
        <body>
            <p>Hey ${username},</p>
            <p>This is the code you requested for password change: ${otp}</p>
        </body>
    `;
    const recipient = email;
    const subject = 'Passowrd change request';
    
    return mail({body, recipient, subject});
}

//TODO: fill this
function mail({body, subject, recipient}) {
    assert.ok(body); assert.ok(subject); assert.ok(recipient);
    return Promise.resolve();
}

module.exports = {
    sendPasswordChangeEmail
};