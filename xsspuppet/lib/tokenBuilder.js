const jwt = require('jsonwebtoken');

const CONFIG = {
    keys: {
        lvl1: 'eQbo4AQ3Nismo3D65llwiGrOFFnODgP8',
        lvl2: '011FFAVm4uKhI02s48aXqqQw4BhCwHnM',
        lvl3: 'lBTHdSVmCegf42djLlRLJC9NhbqFw938',
        lvl4: '6K5ZM2PFWnvFsxRZChciM1zcvgWXAFmp',
        lvl5: 'qSaAS5L178ujLSVqMnxUTXZx1H93OdbR'
    },
    users: {
        admin: {
            id: 1,
            user: 'bender',
            name: 'Bender Bending Rodriguez',
            isAdmin: 1
        },
        user: {
            id: 2,
            user: 'fry',
            name: 'Phillip J. Fry',
            isAdmin: 0
        }
    }
};

class TokenBuilder {
    static getUserKey(level, admin) {
        if (admin)
        {
            return jwt.sign(CONFIG.users['admin'], CONFIG.keys[`lvl${level}`]);
        }
        else
        {
            return jwt.sign(CONFIG.users['user'], CONFIG.keys[`lvl${level}`]);
        }
    }
}

module.exports = TokenBuilder;