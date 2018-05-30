var out = process.stdout;


var id;
out.on('resize', function () {
    if (id) {
        clearTimeout(id);
    }
    id = setTimeout(function () {
        console.log('' + out.columns + 'x' + out.rows);
        id = null;
    }, 100);
});

setTimeout(function(){}, 60000);