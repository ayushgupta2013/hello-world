 //TODO: fix colon absent values and put em inside ''
//just testing for git
const TYPE_STUDENT = 'student'; const TYPE_FACULTY = 'faculty';

module.exports = function(mysql) {

    function findUserByEmail(email) {
        return new Promise(function(resolve, reject){
            mysql.query(`SELECT * FROM Login WHERE email='${email}'`, function(err, rows){
                if (err) { reject(err);return; }
                if (!rows.length) { resolve(null); return;}//user with email not found
                resolve(toUserDomain(rows[0]));
            });
        });
    }
    
    function findUserByUsername(username) {
        return new Promise(function(resolve, reject){
            mysql.query(`SELECT * FROM Login WHERE username = '${username}'`, function(err, rows){
                if (err) {reject(err); return;}
                if (!rows.length) { resolve(null); return;}//user with username not found
                resolve(toUserDomain(rows[0]));
            });
        });
    }

    function findUserByCWID(cwid) {
        return new Promise(function(resolve, reject){
            mysql.query(`SELECT * FROM Login WHERE cwid='${cwid}'`, function(err, rows){
                if (err) {reject(err);return;}
                if (!rows.length) { resolve(null); return;}//user with cwid not found
                resolve(toUserDomain(rows[0]));
            });
        });
    }
    
    
    function findStudentByCWID(cwid)
    {
        return new Promise(async (resolve, reject) => {
            const user = await findUserByCWID(cwid);
            if (!user) { reject(new Error('User not found with following cwid')); return; }
            if (user.userType !== TYPE_STUDENT) { reject(new Error('CWID does not belong to student')); return; }
            
            const queryString = `SELECT * FROM Student WHERE cwid='${cwid}'`;
            mysql.query(queryString, function(err, rows) {
                if (err) { reject(err); return; }
                if (!rows.length || !rows[0]) { resolve(null); return;}//student with cwid not found
                const studentRow = rows[0];
                resolve(toStudentDomain(user, studentRow));
            })
        });
    }
    
    function findFacultyByCWID(cwid) {
        return new Promise(async (resolve, reject) => {
            const user = await findUserByCWID(cwid);
            if (!user) { reject(new Error('User not found with following cwid')); return; }
            if (user.userType !== TYPE_FACULTY) { reject(new Error('CWID does not belong to faculty')); return; }
            
            const queryString = `SELECT * FROM Faculty WHERE cwid='${cwid}'`
            mysql.query(queryString, function(err, rows) {
                if (err) { reject(err); return; }
                if (!rows.length || !rows[0]) { resolve(null); return;}//faculty with cwid not found
                const facultyRow = rows[0];
                resolve(toFacultyDomain(user, facultyRow));
            })
        });
    }
    
    function createUser({cwid, username, email, password, loginToken, userType}) {
        return new Promise(function(resolve, reject){
            const signupOtpVerified = false;
            const queryString = `INSERT INTO Login (cwid, username, email, password, loginToken, signupOtpVerified, userType) VALUES ('${cwid}','${username}','${email}','${password}','${loginToken}',${signupOtpVerified},'${userType}');`
            mysql.query(queryString, async function(err) {
                if (err) { reject(err); return; }
                const user = await findUserByCWID(cwid)
                resolve(user);
            });
        });
    }

    //make sure Login table already has row with following cwid
    async function createStudent({cwid, username, email, password, loginToken, fname, lname}) {
        await createUser({cwid, username, email, password, loginToken, userType: TYPE_STUDENT});

        return new Promise(function(resolve, reject) {
            const queryString = `INSERT INTO Student (cwid, fname, lname) VALUES('${cwid}', '${fname}', '${lname}')`;
            mysql.query(queryString, async function(err) {
                if (err) { reject(err); return; }
                const student = await findStudentByCWID(cwid);
                console.log('entered here');
                resolve(student);
            })
        });
    }

    //make sure Login table already has row with following cwid
    async function createFaculty({cwid, username, email, password, loginToken, fname, lname}) {
        await createUser({cwid, username, email, password, loginToken, userType: TYPE_FACULTY});

        return new Promise(function(resolve, reject) {
            const queryString = `INSERT INTO Faculty (cwid, fname, lname) VALUES('${cwid}', '${fname}', '${lname}')`;
            mysql.query(queryString, async function(err) {
                if (err) { reject(err); return; }
                const faculty = await findFacultyByCWID(cwid);
                resolve(faculty);
            })
        });
    }

    /*
        toUserDomain takes out passwordOtp field 
        so this method was needed
    */
    function getUserPasswordOtp(username) {
        return new Promise(function(resolve, reject){
            mysql.query(`SELECT * FROM Login WHERE username='${username}'`, function(err, rows) {
                if (err) { reject(err);return; }
                if (!rows.length) { reject(new Error('User with username not found')); return; }
                const user = rows[0];   
                resolve(user.passwordOtp);
            });
        });
    }
    
    async function updateUser(cwid, {password, signupOtp, passwordOtp, signupOtpVerified}) {
        const user_ = await findUserByCWID(cwid);
        if (!user_) return Promise.reject(new Error('User with cwid not found'));
        let setParam = `SET `;
        if (password !== undefined) {
            setParam += `password='${password}' `
        }
        if (signupOtp !== undefined)
        {
            setParam += `signupOtp='${signupOtp}' `
        }
        if (passwordOtp !== undefined)
        {
            setParam += `passwordOtp='${passwordOtp}' `
        }
        if (signupOtpVerified!== undefined)
        {
            setParam += `signupOtpVerified='${signupOtpVerified}' `
        }
        const queryString = `UPDATE Login ${setParam} WHERE cwid='${cwid}'`;
    
        return new Promise((resolve, reject) => {
            mysql.query(queryString, err => {
                if (err) { reject(err); return; }
                resolve();
            });            
        })
    }
    
    return {
        findUserByEmail,
        findUserByUsername,
        createFaculty,
        createStudent,
        createUser,
        getUserPasswordOtp,
        updateUser,
        findFacultyByCWID,
        findStudentByCWID,
        TYPE_STUDENT,
        TYPE_FACULTY
    };
}

/*
    maps database row, to application concerened User, so that if database field name changes,
    application codebase would not have to be hunted down for changes.

    also helps in hiding unnecessary fields
*/
function toUserDomain(row) {
    return {
        cwid: row.cwid,
        username: row.username,
        email: row.email,
        password: row.password,
        loginToken: row.loginToken,
        userType: row.userType,
        emailVerified: !!row.signupOtpVerified
    }
}

function toStudentDomain(userDomain, studentRow) {
    return { ...userDomain, fname: studentRow.fname, lname: studentRow.lname };
}

function toFacultyDomain(userDomain, facultyRow) {
    return { ...userDomain, fname: facultyRow.fname, lname: facultyRow.lname };
}