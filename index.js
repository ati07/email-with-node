const nodemailer = require('nodemailer');
const { ProxyAgent } = require('proxy-agent');
const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');
require("dotenv").config();




// Fetch Proxy 

async function fetchWithProxy(url, host, username, password, proxy_port) {

    while (true) {
        try {
            const response = await axios.get(url, {
                proxy: {
                    host: host,
                    port: proxy_port,
                    auth: {
                        username: username,
                        password: password
                    }
                },
                timeout: 10000  // 10 seconds timeout
            });
            // console.log(response.data);
            if (response.status === 200) {
                return response.data
                // break
            } else {
                console.log('Failed to get IP, Fetching again....')
                fs.appendFile('log.txt', `${new Date()}------> Return with code ${response.status}\n`, 'utf8', (error) => {
                    if (error) {
                        console.error('An error occurred while writing to the file:', error);
                        return;
                    }
                    // console.log('File has been written successfully.');
                });
            }


        } catch (error) {
            // console.error('Error fetching URL:', error.message);
            fs.appendFile('log.txt', `${new Date()}------> ${error.message}\n`, 'utf8', (error) => {
                if (error) {
                    console.error('An error occurred while writing to the file:', error);
                    return;
                }
                // console.log('File has been written successfully.');
            });
            continue
        }
    }

}

// read File
async function readFilePromise(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data;
    } catch (err) {
        throw err;
    }
}


// Email details ip_address

async function sendEmail(ip_address, filterEmail) {
    let SMARTPROXY_USERNAME = 'sp845095ff'
    let SMARTPROXY_PASSWORD = 'Ku536Aj8PulxeOgdfg'
    let SMARTPROXY_ENDPOINT = 'gate.smartproxy.com'
    let SMARTPROXY_HTTP_PORT = 7000

    // # Email details
    let FROM_EMAIL = 'Info <info@svscolleges.org>'
    let TO_EMAIL = filterEmail
    let SUBJECT = 'Test Email with IP Rotation'
    // Proxy configuration
    const proxyUrl = `http://${SMARTPROXY_USERNAME}:${SMARTPROXY_PASSWORD}@${SMARTPROXY_ENDPOINT}:${SMARTPROXY_HTTP_PORT}`;

    const smtpConfig = {
        host: process.env.SMPT_HOST,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMPT_USER,
            pass: process.env.SMPT_PASS,
        },
        connectionTimeout: 5000, // Connection timeout
        greetingTimeout: 5000, // Greeting timeout
        socketTimeout: 5000, // Socket timeout
        tls: {
            rejectUnauthorized: false, // do not fail on invalid certs
        },
        // logger: true, // Enable logging
        // debug: true // Include SMTP traffic in the logs
        agent: new ProxyAgent(proxyUrl),
        name: ip_address ?? 'mail.svscolleges.org',
    };

    try {
        // Create a transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(smtpConfig);
        let htmlContent = await readFilePromise('letter2.html')
        // Create a message object
        const mailOptions = {
            from: FROM_EMAIL, // sender address
            to: TO_EMAIL, // list of receivers
            subject: SUBJECT, // Subject line
            // text: 'Hello world?', // plain text body
            html: htmlContent, // html body
            date: new Date(), // setting the date
            messageId: `<${makeMessageId()}>`, // custom message ID
            headers: {
                'List-Unsubscribe': '<mailto:info@svscolleges.org>, <https://svscolleges.org/unsubscribe/>'
            },
        };

        // Function to generate a custom message ID
        function makeMessageId() {
            return `${Date.now()}@example.com`;
        }

        // Send email
        try {
            let info = await transporter.sendMail(mailOptions);
            // console.log('Message sent: %s', info.messageId);
            // console.log(`Email sent to ${filterEmail} | IP used: ${ip_address}`)
            return `Email sent to ${filterEmail} | IP used: ${ip_address}`
        } catch (e) {
            console.log()
            fs.appendFile('log.txt', `${new Date()}------> ${e}\n`, 'utf8', (error) => {
                if (error) {
                    console.error('An error occurred while writing to the file:', error);
                    return;
                }
                // console.log('File has been written successfully.');
            });
            return `error while sending the email wait..... it will send again, ${e}`
        }


    } catch (error) {
        // console.error();
        fs.appendFile('log.txt', `${new Date()}------>Failed to send email: ${error}\n`, 'utf8', (error) => {
            if (error) {
                console.error('An error occurred while writing to the file:', error);
                return;
            }
            // console.log('File has been written successfully.');
        });
        return `Failed to send email:, ${error}`
    }
}

// Usage with async/await
(async () => {

    const data = await readFilePromise('emails.txt');
    let emails = data.split('\n')

    let HitPerEmail = false // make true if you want to hit proxy on each email 
    let numberOfEmailSend = 0;
    let proxyDetail;

    while (true) {
        try {

            let filterEmail = emails[numberOfEmailSend].replace(/(\r\n|\n|\r)/gm, "")
            // Proxy credentials

            let url = 'https://ip.smartproxy.com/json'
            let proxy_user = 'sp845095ff'
            let proxy_pass = 'Ku536Aj8PulxeOgdfg'
            let proxy_ip = 'gate.smartproxy.com'
            let proxy_port = 7000

            if (HitPerEmail) {

                proxyDetail = await fetchWithProxy(url, proxy_ip, proxy_user, proxy_pass, proxy_port)

            } else {
                // console.log('numberOfEmailSend',numberOfEmailSend)
                if ((numberOfEmailSend === 0 || (numberOfEmailSend % 3) === 0)) {

                    proxyDetail = await fetchWithProxy(url, proxy_ip, proxy_user, proxy_pass, proxy_port)

                }
            }
            // Call the function to send the email
            if (filterEmail !== '') {
                const status = await sendEmail(proxyDetail?.proxy?.ip, filterEmail);
                numberOfEmailSend += 1
                console.log(status);
            } else {
                console.log('No Email to send')
                break;
            }
            // break loop after sending the all emails
            if(emails.length === numberOfEmailSend){
                break;
            }


            // }
        } catch (err) {
            // console.error('Error', err);
            fs.appendFile('log.txt', `${new Date()}------> ${err}\n`, 'utf8', (error) => {
                if (error) {
                    console.error('An error occurred while writing to the file:', error);
                    return;
                }
                // console.log('File has been written successfully.');
            });
        }
    }

})();


