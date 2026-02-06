function generateCode() {
    let number = Math.floor(Math.random() * 1000000)+100000; // ★★난수 발생 ★★★★★
    if(number>1000000){                                      // ★★
       number = number - 100000;                             // ★★
    }
    return String(number)
}
module.exports = {
    generateCode,
}