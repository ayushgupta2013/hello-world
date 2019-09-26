const assert = require('assert');
const lib = require('./lib');
const mailer = require('./mailer');

module.exports =  function(repository) {
    
    /*
        return 0 if user not found
        return 1 if pwd not verified
        return user if alls ok
    */
    async function loginByEmail(email, pwd) {
        assert.ok(email); assert.ok(pwd);
        const user = await repository.findUserByEmail(email);
        if (!user) return 0;
        if (user.password !== pwd) return 1;
        
        return user;
    }
   
    /*
        return 0 if user not found
        return 1 if pwd not verified
        return user if alls ok
    */
    async function loginByUsername(username, pwd) {
        assert.ok(username); assert.ok(pwd);
        const user = await repository.findUserByUsername(username);
        if (!user) return 0;
        if (user.password !== pwd) return 1;

        switch(user.userType) {
            case repository.TYPE_STUDENT: {
                const user_ = await repository.findStudentByCWID(user.cwid);
                return user_? user_: 0;               
            } break;
            case repository.TYPE_FACULTY: {
                const user_ = await repository.findFacultyByCWID(user.cwid);
                return user_? user_: 0;
            } break;
            default: {
                throw new Error('User type not found');
            }
        }
    }

    /*
        @deprecated
        @return Promise<int | UserDomain>
        if Promise<int> then unsucessfull, and int code would signify failed condition
        if Promise<UserDomain>, user created
    */
    async function createUser({cwid, username, email, password}) {
        assert.ok(cwid); assert.ok(username); assert.ok(email); assert.ok(password);
        const loginToken = lib.loginToken.createLoginToken();
        const isCWIDValid = lib.validateFormat.checkCWID(cwid);
        const isUsernameValid = lib.validateFormat.checkUsername(username);
        const isEmailValid = lib.validateFormat.checkEmail(email);
        const isPasswordValid = lib.validateFormat.checkPassword(password);

        if (!isCWIDValid) return 0; //throw new Error('CWID invalid');
        if (!isUsernameValid)  return 1; //throw new Error('Username invalid');
        if (!isEmailValid) return 2; //throw new Error('Email invalid');
        if (!isPasswordValid) return 3;//throw new Error('Password invalid');

        //save
        return repository.createUser({ cwid, username, email, password, loginToken });
    }

    async function refreshSignupOtp(CWID) {
        assert.ok(CWID);
        const user = await repository.findUserByCWID(CWID);
        if (!user) throw new Error('User not found');
        
        const signupOtp = lib.otp.generateRandomOtp();
        await repository.updateUser({signupOtp});
    }

    /*
        @returns Promise<string>
        e.g. Promise.resolve(() => '33333');
    */
    async function requestPasswordUpdate(username) {
        const user = await repository.findUserByUsername(username);
        if (!user) throw new Error('User not found');
        const otp = lib.otp.generateRandomOtp();
        await repository.updateUser(user.cwid, {passwordOtp: otp});
        await mailer.sendPasswordChangeEmail({username: username, email: user.email, otp});
        return otp;
    }

    /*@param username: string
      @param otp: number | string
    */
    async function verifyPasswordOtp(username, otp) {
        assert.ok(username); assert.ok(otp);
        const otp_ = await repository.getUserPasswordOtp(username);
        return otp + '' === otp_ + '';
    }

    //TODO: nullify passwordOtp upon succesfull password change
    async function updatePassword(username, newPassword) {
        const isPasswordValid = lib.validateFormat.checkPassword(newPassword);
        if (!isPasswordValid) throw new Error('Password invalid');

        const user = await repository.findUserByUsername(username);
        if (!user) throw new Error('User not found');

        if (user.password === newPassword) throw new Error('Old password used');

        //update password in database
        await repository.updateUser(user.cwid, {password: newPassword});
    }

    async function getUserByLoginToken(loginToken) {
        assert.ok(loginToken);
        return await repository.findUserByLoginToken(loginToken);
    }

    /*
        return null if no role
        'student' if role is student
        'faculty' if role is faculty
    */
    async function getRole(cwid) {
        assert.ok(cwid);
        const student = await repository.findStudentByCWID(cwid);
        if (student) return 'student';

        const faculty = await repository.findFacultyByCWID(cwid);
        if (faculty) return 'faculty';

        return null;        
    }

    async function getFaculty(cwid) {
        assert.ok(cwid);
        const faculty = await repository.findFacultyByCWID(cwid);
        return faculty;
    }

    async function getStudent(cwid) {
        assert.ok(cwid);
        const student = await repository.findStudentByCWID(cwid);
        return student;
    }

    async function createStudent({cwid, username, email, password, fname, lname}) {
        assert.ok(cwid); assert.ok(username); assert.ok(email); assert.ok(password);
        assert.ok(fname); assert.ok(lname);

        const loginToken = lib.loginToken.createLoginToken();

        const isCWIDValid = lib.validateFormat.checkCWID(cwid);
        const isUsernameValid = lib.validateFormat.checkUsername(username);
        const isEmailValid = lib.validateFormat.checkEmail(email);
        const isPasswordValid = lib.validateFormat.checkPassword(password);
        const isFnameValid = lib.validateFormat.checkFname(fname);
        const isLnameValid = lib.validateFormat.checkLname(lname);

        if (!isCWIDValid) return 0; //throw new Error('CWID invalid');
        if (!isUsernameValid)  return 1; //throw new Error('Username invalid');
        if (!isEmailValid) return 2; //throw new Error('Email invalid');
        if (!isPasswordValid) return 3;//throw new Error('Password invalid');
        if (!isFnameValid || !isLnameValid) return 4;//invalid First/Last name

        return repository.createStudent({cwid, username, email, loginToken, password, fname, lname});        
    }

    async function createFaculty({cwid, username, email, password, fname, lname}) {
        assert.ok(cwid); assert.ok(username); assert.ok(email); assert.ok(password);
        assert.ok(fname); assert.ok(lname);

        const loginToken = lib.loginToken.createLoginToken();

        const isCWIDValid = lib.validateFormat.checkCWID(cwid);
        const isUsernameValid = lib.validateFormat.checkUsername(username);
        const isEmailValid = lib.validateFormat.checkEmail(email);
        const isPasswordValid = lib.validateFormat.checkPassword(password);
        const isFnameValid = lib.validateFormat.checkFname(fname);
        const isLnameValid = lib.validateFormat.checkLname(lname);

        if (!isCWIDValid) return 0; //throw new Error('CWID invalid');
        if (!isUsernameValid)  return 1; //throw new Error('Username invalid');
        if (!isEmailValid) return 2; //throw new Error('Email invalid');
        if (!isPasswordValid) return 3;//throw new Error('Password invalid');
        if (!isFnameValid || !isLnameValid) return 4;//invalid First/Last name

        return repository.createFaculty({cwid, username, email, loginToken, password, fname, lname});   
    }

    //NOTE: login by cwid if needed
    return {
        loginByEmail,
        loginByUsername,
        updatePassword,
        requestPasswordUpdate,
        verifyPasswordOtp,
        createFaculty,
        createStudent
        // getUserByLoginToken,
        // getRole,
        // getFaculty,
        // getStudent
    };
}