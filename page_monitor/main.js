const fs = require('fs');
const later = require('later');
const request = require('request');
const nodemailer = require('nodemailer');

const config = JSON.parse(fs.readFileSync('./config.json'));

const transporter = nodemailer.createTransport(config.mailer);

let toMe = config.to_author.join('');
let toWeb_1 = config.to_all.join(',');
let htmlNetError = '';
let htmlResError = '';

const mailOptions = {
    from: `Jamais<${config.mailer.auth.user}>`,
    to: toMe,
    subject: 'Web page monitor',
    //text: 'test',
    html: ''
};

let sched = {schedules: [{m: [0]}]};
// let sched = later.parse.text('every 1 min');
let timer = later.setInterval(monitor, sched);

const requestUrls = config.urls;

function monitor() {
    requestUrls.forEach(function(item, index) {
        console.log('begin: ' + item);
        request({
            method: 'GET',
            url: item,
            timeout: 30000
        }, function (error, response, body) {
            var nowTime = new Date();
            if(error) {
                htmlNetError = htmlNetError + '<div>' +
                    'site: ' + '<pre>' + item + '</pre>' +
                    'error code: ' + error.code + '<br />' +
                    'error no: ' + error.errno + '<br />' +
                    'error syscall: ' + error.syscall + '<br />' +
                    'connect: ' + error.connect + '<br />' +
                    'address: ' + error.address + '<br />' +
                    'port: ' + error.port + '<br />' +
                    'time: ' + nowTime +
                    '<hr />' +
                    '</div>';

                console.log(error);
                console.log(nowTime);
            } else {
                if(response.statusCode != 200 && response.statusCode != 302) {
                    // website error
                    htmlResError = htmlResError + '<div>' +
                        'site: ' + '<pre>' + item + '</pre>' +
                        'status code: ' + response.statusCode + '<br />' +
                        'time: ' + nowTime +
                        '<hr />' +
                        '</div>';
                }

                console.log(item + '\n ' + response.statusCode + '\n ' + nowTime);
            }

            if (index >= requestUrls.length - 1) {
                sendTo();
            }
        });
    });
}

function sendTo() {
    if (!htmlNetError && !htmlResError) {
        console.log('No Error to send');
        return;
    }
    if (htmlNetError) {
        mailOptions.html = htmlNetError;
        mailOptions.to = toMe;
        transporter.sendMail(mailOptions);
    }
    if (htmlResError) {
        mailOptions.html = htmlResError;
        mailOptions.to = toWeb_1;
        transporter.sendMail(mailOptions);
    }

    htmlNetError = '';
    htmlResError = '';
}

console.log('monitor is running ' + new Date().toISOString());
