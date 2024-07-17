process.on('message', message => {
    let result = 0;
        for (let i = 0; i <= 3e9; i++ ) result += i 
        //return result;
        process.send(result);
});