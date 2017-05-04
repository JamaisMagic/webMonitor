var fs = require('fs');
var mChildProcess = require('child_process');
var mPath = require('path');
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'test',
    port: 3306
});
connection.connect();

var info = JSON.parse(fs.readFileSync('./info.json'));
var sqlStr = 'SELECT id, src_url FROM spider_contentinfo WHERE id >= ' + (info.last_query_id || 0) + ' LIMIT 1000';

connection.query(sqlStr, function(err, rows, fields) {
    connection.end();
    if (err) {
        console.error(err);
        return;
    }
    var now = Date.now();
    var length = 0;
    if (rows && rows.length > 0) {
        length = rows.length;
        info.last_query_id = (rows[length - 1].id || 0) + 1;
        info.last_query_count = length;
        info.last_query_time = new Date(now);
        info.total_query_times = (info.total_query_times || 0) + 1;

        console.log(new Date() + 'query success. count: ' + length);
        fs.writeFileSync('./static/source/url_obj.txt', JSON.stringify(rows));
        fs.writeFile('./info.json', JSON.stringify(info));

        //'phantomjs --ssl-protocol=any shot.js'
        mChildProcess.exec('slimerjs shot_slimer.js', {
            cwd: mPath.resolve('./'),
            maxBuffer: 1024 * 5000
        }, function(err, stdout, stderr) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(new Date() + 'exec end\n');
            console.log(stdout);
            console.error(stderr);
        });
    }
    console.log(new Date() + 'query end');
});

