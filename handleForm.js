//#region Global Variables
const readln = process.stdout;
const { promisify } = require('util');
const fs = require('fs');
const readFile = promisify(fs.readFile);
const open = promisify(fs.open);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const path = require('path');
const { XMLHttpRequest } = require('xmlhttprequest');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhonex = devices['iPhone X'];
const isPkg = typeof process.pkg !== 'undefined';

let chromiumPath = (isPkg ? 
  puppeteer.executablePath().replace(
    process.platform!='win32' ? /^.*?\/node_modules\/puppeteer\/\.local-chromium/ : /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
    path.join(path.dirname(process.execPath), 'chromium')
  ) :
  puppeteer.executablePath()
);

const siteData = {
  appName: 'dofus',
  app: 'https://www.dofus.com/fr/mmorpg/jouer',
  appHome: 'https://www.dofus.com/fr',
  appLogout: 'https://account.ankama.com/sso?action=logout&from=https%3A%2F%2Fwww.dofus.com%2Ffr',
  username: '#userlogin',
  password: '#user_password',
  verify_pass: '#user_password_confirm',
  email: '#user_mail',
  birthDay: '#ak_field_1',
  birthMonth: '#ak_field_2',
  birthYear: '#ak_field_3',
  newletterCheck: 'body > div.ak-mobile-menu-scroller > div.container.ak-main-container > div > div:nth-child(1) > div > div > div > div.ak-inner-block > div > div.col-md-8 > div > form > fieldset > div > div > div > div:nth-child(8) > div > div > label',
  submit: '#submit_field',
  siteKey: '6LfbFRsUAAAAACrqF5w4oOiGVxOsjSUjIHHvglJx'
};

const defaultData = {
  inputFileName: 'proxy.txt',
  outputFileName: 'accounts.txt',
  dirs: {
    captureDir: 'capture',
    logDir: 'log',
    outDir: 'out'
  },
  proxyAllowedCountries: [
    'BD','BE','BJ','MM','BO','CM','CA','CY','FR','GB','IQ','JP','PG','PY','PR','PE','SV','SD','PS','LK'
  ]
};

const stdClrs = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
};

const ipValidityUrl = 'https://hidemyna.me/api/geoip.php?out=js&htmlentities';
const antiCaptchaKey = 'KEYHERE'; //Anti-captcha key
const createTaskUrl = 'https://api.anti-captcha.com/createTask';
const getTaskResultUrl = 'https://api.anti-captcha.com/getTaskResult';
const mailDomain = '@exemple.com'; //remplacez par votre domaine mail
const getMailListUrl = 'https://mailsac.com/api/addresses/*@exemple.com/messages?_mailsacKey=SITEKEYHERE'; //mettre ici domaine mail & clé api mail

// Filtering and detecting arguments
const arguments = process.argv;
let skipNext = false;
let inputFile, outputFile, 
    useProxy = true,
    useEmulation = false;

arguments.forEach((arg, key) => {
  if(key < 1 || skipNext){
    skipNext = false;
    return;
  } 
  if(arg[0] === '-'){
    skipNext = true;
    switch (arg[1]) {
      case 'i':
        inputFile = arguments[key+1];
        break;
    
      case 'o':
        outputFile = arguments[key+1];
        break;

      case '-':
        switch (arg.substring(2)) {
          case 'use-proxy':
            useProxy = true;            
            break;
          
          case 'no-proxy':
            useProxy = false;
            break;

          case 'use-emulation':
            useEmulation = true;
            break;

          case 'no-emulation':
            useEmulation = false;
            break;
          
          default:
            break;
        }
        break;

      default:
        skipNext = false;
        console.error('Unknown argument Encountered');
        break;
    }
  }
});

if(!inputFile) {
  inputFile = defaultData.inputFileName; 
}
if(!outputFile) {
  outputFile = defaultData.dirs.outDir+'/'+defaultData.outputFileName;
}

//#endregion

//#region Helper Functions

const delay = (seconds) => new Promise((resolves) => {
  setTimeout(resolves, seconds*1000);
});

const tempId = () => {
  const getRandomString = () => Math.random().toString(36).substr(2, 9);
  let isNumber = (temp, key) => !isNaN(temp.charAt(key));

  let tempStr = getRandomString();
  let firstChar = isNumber(tempStr, 0);
  let numCount = 0;
  while(firstChar || numCount==0) {
    numCount = 0;
    tempStr = getRandomString();
    firstChar = isNumber(tempStr, 0);
    for (let i = 0; i < tempStr.length; i++) {
      if(isNumber(tempStr, i)){
        numCount++;
      }
    }
  }

  let firstLtr = tempStr.charAt(0);
  return tempStr.replace(firstLtr, firstLtr.toUpperCase());
}

const getRnd = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getFrenchMonth = function(month) {
  const months = {
    "1": "Janvier",
    "2": "Fevrier",
    "3": "Mars",
    "4": "Avril",
    "5": "Mai",
    "6": "Juin",
    "7": "Juillet",
    "8": "Aout",
    "9": "Septembre",
    "10": "Octobre",
    "11": "Novembre",
    "12": "Decembre",
  };
  
  return months[`${month}`];
}

var _loadTick = 0;
var _msg = "";
const waiting = (msg, t) => {
  _msg = msg;
  return setInterval(() => {
    readln.clearLine();
    readln.cursorTo(0);
    _loadTick = (_loadTick + 1) % 4;
    
    var dots = new Array(_loadTick + 1).join(".");
    readln.write(msg + dots);
  }, t);
}

const stopWaiting = (timer, status) => {
  clearInterval(timer);
  loadTick = 0;
  readln.clearLine();
  readln.cursorTo(0);
  readln.write(_msg + "... "+ status + stdClrs.Reset+ "\n");
}

const keypress = async () => {
  process.stdin.setRawMode(true)
  return new Promise(resolve => process.stdin.once('data', () => {
    process.stdin.setRawMode(false)
    resolve()
  }));
}

const getTwoDigitString = (no) => ("0" + no.toString()).slice(-2);

var getDateTime = () => {
  let date = new Date();
  return "["+getTwoDigitString(date.getDate())+"-"+getTwoDigitString(date.getMonth())+"-"+getTwoDigitString(date.getFullYear())+" "+getTwoDigitString(date.getHours())+":"+getTwoDigitString(date.getMinutes())+":"+getTwoDigitString(date.getSeconds())+"]";
}

//#endregion

//#region Utility Functions
//#region   File Control Functions

const checkDir = async (dir, callback) => new Promise(async (resolve, reject) => {
  await stat(dir, function(err, stats) {
    if(!err) return;
    if (err && err.errno === -4058) {
      mkdir(dir);
    } else {
      callback(err)
    }
  });
});

const readInputFile = (fileName) => new Promise(async (resolve, reject) => {
	console.log('\x1b[36m%s\x1b[0m', 'Createur de compte - Syliaz#1452'); 
    console.log('\x1b[36m%s\x1b[0m', 'Discord : https://discordapp.com/invite/FqwpVQW');
  
  try {
    readFile(fileName, 'utf-8', (err, content) => {
      if(err) {
        return reject(err);
      }

      var proxyList = [];
      content.split('\n').forEach((line, key) => {
        let proxy = line.trim().split(':');

        if(proxy == '' || proxy[0].split('.').length < 4) {
          // console.error('Invalid type of IP address Detected: ', proxy);
          return;
        }

        let tempObj = {};
        tempObj["_id"] = key;
        tempObj["ip"] = proxy[0];
        tempObj["port"] = proxy[1];

        proxyList.push(tempObj);
      });

      if(proxyList.length == 0) {
        console.log('No Proxy IPs found in the given file.\nTerminating application...');
        return reject({ errorId: 1, msg: 'No IP found' });
      }

      console.log(`${proxyList.length} proxy IPs found`);
      return resolve(proxyList);
    });
  } catch (err) {
    console.log(`Error occured when reading \'${fileName}\'': `, err);
    return reject({ errorId: -1, error: err });
  }
});

const writeOutputFile = (fileName, data) => new Promise(async (resolve, reject) => {
  open(fileName, 'a', (err, fd) => {
    if (err) throw err;
    fs.appendFile(fd, data, 'utf8', (err) => {
      fs.close(fd, (err) => {
        if (err) throw err;
      });
      if (err) throw err;
      resolve({ status: 'success' });
    });
  });
});

const LOG = async (log) => {
  await writeOutputFile('log/LOG.txt', `${getDateTime()} ${log}\n`);
}

//#endregion
//#region   Browser Control functions

// Initialize browser window for proxy details
const initBrowser = (proxy) => new Promise(async (resolve, reject) => {
  try {
    let browser = await puppeteer.launch({
      executablePath: chromiumPath,
      // headless: false,
      // slowMo: 100,
      args: (useProxy)?[ `--proxy-server=${proxy.ip}:${proxy.port}` ]:[]
    });

    resolve(browser);
  } catch (error) {
    console.log('Error in initBrowser: ', error);
    // reject(error);
  }
});

// Close pre-opened browser window
const closeBrowser = (browser) => new Promise(async (resolve, reject) => {
  try {
    await browser.close();
    return resolve({ status: 'success' });
  } catch (error) {
    console.log('Error in closeBrowser: ', error);
    reject(error);
  }
});

//#endregion
//#region   Network Requests

const creatAntiCaptchaTask = () => new Promise(async (resolve, reject) => {
  let http = new XMLHttpRequest();

  http.onload = function(e) {
    if(http.readyState === 4) {
      let taskData = JSON.parse(http.responseText);
      if(taskData.errorId !== 0)
            reject(taskData);
        resolve(taskData);
    } else console.log('Error in response Data \'anti-captcha task creation\'');
  }

  try {
    http.open("POST", createTaskUrl, true);
    http.responseType = "json";
    http.send(JSON.stringify({
      "clientKey": `${antiCaptchaKey}`,
      "task":
        {
          "type":"NoCaptchaTaskProxyless",
          "websiteURL":"https:\/\/www.dofus.com\/fr\/mmorpg\/jouer",
          "websiteKey": `${siteData.siteKey}`
        },
      "softId":0,
      "languagePool":"en"
    }));
  } catch(err) {
    console.log('Error in anti-captcha request', err);
    reject(err);
  }
});

const getAntiCaptchaResponseKey = (taskId) => new Promise(async (resolve, reject) => {
  let http = new XMLHttpRequest();

  http.onload = async function(e) {
    let response = JSON.parse(http.responseText);
    
    if(response.status === "processing") {
      setTimeout(() => {
        return resolve(getAntiCaptchaResponseKey(taskId));
      }, 2000);
    } else {
      if(response.errorId !== 0) return reject(response);
      return resolve(response);
    }
  }

  try {
    http.open("POST", getTaskResultUrl, true);
    http.responseType = "json";
    http.send(JSON.stringify({
      clientKey: `${antiCaptchaKey}`, 
      taskId: `${taskId}`
    }));
  } catch (error) {
    console.log('Error in anti-captcha responseKey request', error);
    return reject(error);
  }
});

const getValidationLink = (username) => new Promise(async (resolve, reject) => {
  let http = new XMLHttpRequest();

  http.onload = function(e) {
    let mails = JSON.parse(http.responseText);
    
    let mailCount = 0;
    mails.forEach((mail) => {
      if(mail.originalInbox == username + mailDomain){
        mailCount++;
        mail.links.forEach((link) => {
          if(link.substr(8,13) == 'www.dofus.com'){
            return resolve(link);
          }
        });
      }
    });

    if(mailCount == 0){
      setTimeout(() => {
        return resolve(getValidationLink(username));
      }, 2000);
    }
  }

  http.open("GET", getMailListUrl, true);
  http.responseType = "json";
  http.send();
});

const getAllMails = () => new Promise(async (resolve, reject) => {
  let http = new XMLHttpRequest();
  let mailList = [];

  http.onload = () => {
    let mails = JSON.parse(http.responseText);

    mails.forEach((mail) => {
        mailList.push(mail);
    })

    return resolve(mailList);
  }
  http.open("GET", getMailListUrl, true);
  http.responseType = "json";
  http.send();
});

const getMail = (mailId) => new Promise(async (resolve) => {
  let http = new XMLHttpRequest();

  http.onload = () => {
      if(http.readyState === 4){
            let msg = JSON.parse(http.responseText);
            // console.log(mailId, msg);
            return resolve(msg);
      }
  }
  http.open("GET", `https://mailsac.com/api/addresses/*@exemple.com/messages/${mailId}/?_mailsacKey=SITEKEYHERE`);//mettre domaine mail & clé api mail
  http.send();
});

const deleteMail = (mailId) => new Promise(async (resolve) => {
  let http = new XMLHttpRequest();

  http.onload = () => {
      if(http.readyState === 4){
            let msg = JSON.parse(http.responseText);
            // console.log(mailId, msg);
            return resolve(msg);
      }
  }
  http.open("DELETE", `https://mailsac.com/api/addresses/*@gmail.msdc.co/messages/${mailId}/?_mailsacKey=SITEKEYHERE`);//mettre domaine mail & clé api mail
  http.send();
})

//#endregion
//#endregion

//#region Task Handling Functions

const handleProxyFile = async () => {
  // TODO
}

const handleAntiCaptcha = async () => {
  await LOG('Creating Anti-Captcha Task');
  let task;
  try {
    task = await creatAntiCaptchaTask();
    await LOG(`Anti-Captcha Task created: ${JSON.stringify(task)}`);
  } catch (error) {
    await LOG(`An error occured: ${error}`);
    return false;
  }
  
  await LOG('Requesting Anti-Captcha response key')
  let response = null;
  try {
    response = await getAntiCaptchaResponseKey(task.taskId);
    await LOG(`Anti-Captcha response key recieved: ${JSON.stringify(response)}`);
    
    response = response.solution.gRecaptchaResponse;
  } catch (error) {
    await LOG(`An error occured: ${error}`);
    return false;
  }

  return response;
}

const handleFormSubmission = async (dataIn) => {
  let browser, status;
  if(useProxy) {
    await LOG('Using Proxy for browser');
    console.log(`Using proxy ${dataIn.proxy.ip}:${dataIn.proxy.port}`);

    browser = await initBrowser(dataIn.proxy);
    await LOG('Initializing Browser');
    
    let page = await browser.newPage();
    
    //#region Proxy Validity Check

    let proxyValidity = waiting("Checking proxy Validity", 800);
    try {
      await LOG('Trying to validate IP using an API');
      await page.goto(ipValidityUrl, { waitUntil: "load" });
    } catch (err) {
      await LOG('Error occured during loading IP validation API');
      await page.close();
      await closeBrowser(browser);
      stopWaiting(proxyValidity, (stdClrs.FgRed + "ERROR"));

      return {
        errorId: 3,
        msg: 'Unknown Proxy Error',
        error: err
      };
    }
    await LOG('IP validation URL loaded');
    
    let proxyInfo = await page.evaluate(() => {
      let div = document.querySelector('body > pre'),
      jsonObject = JSON.parse(div.innerText),
      key = Object.keys(jsonObject);
      
      return jsonObject[key];
    })
    await LOG(`Proxy infomarmation recorded: ${proxyInfo}`);
    
    await LOG('Checking for validity of IP');
    let isValid = defaultData.proxyAllowedCountries.find((element) => { 
      return (proxyInfo[0] == element) 
    }) == proxyInfo[0];
    
    if(!isValid) {
      await LOG('IP is not from a valid country');
      await page.close();
      await closeBrowser(browser);
      stopWaiting(proxyValidity, (proxyInfo[0]+stdClrs.FgMagenta + " INVALID"));

      return {
        errorId: 2,
        msg: 'Proxy IP location is not valid'
      }
    }
    stopWaiting(proxyValidity, (stdClrs.FgGreen + " VALID"));
    await LOG('IP is from a valid country');

    //#endregion
    
    await page.close();
  } else {
    await LOG('Initializing Browser');
    console.log('Account Creation Started');
    browser = await initBrowser();
  }
  await LOG('Account Creation Started');
  
  let noOfPages = dataIn.cycles;
  for (let page = 0; page < noOfPages; page++) {
    await LOG(`Starting ${page+1} of ${dataIn.cycles} form submission`);
    let webPage = await browser.newPage();
    
    if(useEmulation) await webPage.emulate(iPhonex);

    let msgStart = stdClrs.FgYellow + `[${page+1}] ` + stdClrs.Reset;

    //#region Loading Signup Page

    let pageLoading = waiting(msgStart + "Page Loading", 800);
    try {
      await webPage.goto(siteData.app, { waitUntil: "load" });
    } catch (err) {
      if(noOfPages < 5) noOfPages++;
      stopWaiting(pageLoading, (stdClrs.FgRed + "ERROR"));
      await LOG(`Error occured while loading: ${siteData.app} ${err}`);
      await webPage.close();

      continue;
    }
    await LOG(`${siteData.app} URL loaded`);
    stopWaiting(pageLoading, (stdClrs.FgGreen + "DONE"));

    //#endregion

    //#region Anti-Captcha handling

    await LOG('Handling Anti-captcha');
    let responseKeyHandle = waiting(msgStart + "Handling Anti-captcha", 500);
    
    let antiCaptchaKey = await handleAntiCaptcha();
    if(antiCaptchaKey == false) {
      stopWaiting(responseKeyHandle, (stdClrs.FgRed + "ERROR"));
      status = {
        errorId: 4,
        msg: 'Error in Anticaptcha Key'
      }
      break;
    }

    await LOG('Anti-captcha response key recieved successfully');
    stopWaiting(responseKeyHandle, (stdClrs.FgGreen + "DONE"))

    //#endregion

    //#region Page Processing
    // process html and inject response key
    let injectLoading = waiting(msgStart + "Page Injection", 400);
    await LOG('Page Alteration Started');
    let alteration = await webPage.evaluate((key) => {
      let divs = document.querySelectorAll("body > div"),
          iframe = document.querySelector('body > iframe'),
          keyArea = document.querySelector('#g-recaptcha-response'),
          form = document.querySelector('body > div.ak-mobile-menu-scroller > div.container.ak-main-container > div > div:nth-child(1) > div > div > div > div.ak-inner-block > div > div.col-md-8 > div > form'),
          btn = document.createElement('input');
      
      if(iframe == null) return {
        errorId: 5,
        error: 'Iframe not found',
        content: iframe
      };
      iframe.parentNode.removeChild(iframe);

      if(divs == null) return {
        errorId: 6,
        error: 'Div not found',
        content: div
      };
      divs.forEach((div) => {
        let top = div.style.top;
        if(top!==''){
          div.parentNode.removeChild(div);
        }
      });

      try {
        keyArea.style.display = "block";
        keyArea.innerHTML = key;
        
        btn.setAttribute('id', 'submit_field');
        btn.setAttribute('type', 'submit');
        form.append(btn);
      } catch (error) {
        return {
          errorId: 7,
          msg: 'Error on alteration',
          error: error 
        };
      }

      return {
        errorId: 0
      };
    }, antiCaptchaKey );

    if(alteration.errorId != 0) {
      await LOG(`Error in page injection: ${JSON.stringify(alteration)}`)
      stopWaiting(injectLoading, (stdClrs.FgRed + "ERROR"));
      await webPage.close();

      continue;
    }
    await LOG('Page Alteration Done');
    stopWaiting(injectLoading, (stdClrs.FgGreen + "DONE"));

    // #endregion

    //#region Form Submission

    let formFilling = waiting(msgStart + "Form Filling", 500);
    await LOG('Starting Form auto filling');
    let userName = tempId(),
      password = tempId(),
      email = userName + mailDomain,
      bDay = ("0" + getRnd(1,10).toString()).slice(-2),
      bMonth = getFrenchMonth(getRnd(1, 12)).toString().substr(0,2),
      bYear = getRnd(1987, 1998).toString();
  
    let formData = {
      username: userName,
      password: password,
      email: email,
      birth: {
        day: bDay,
        month: bMonth,
        year: bYear
      }
    };
    await LOG(`Form filling started using random data ${JSON.stringify(formData)}`);
    
    try {
      await Promise.all([
        await webPage.focus(siteData.username),
        await webPage.keyboard.type(userName),
        await webPage.keyboard.press('Tab'),
        
        await webPage.focus(siteData.password),
        await webPage.keyboard.type(password),
        await webPage.keyboard.press('Tab'),
        
        await webPage.focus(siteData.verify_pass),
        await webPage.keyboard.type(password),
        await webPage.keyboard.press('Tab'),
        
        await webPage.focus(siteData.email),
        await webPage.keyboard.type(email),
        await webPage.keyboard.press('Tab'),
  
        await webPage.focus(siteData.birthDay),
        await webPage.keyboard.type(bDay),
        
        await webPage.focus(siteData.birthMonth),
        await webPage.keyboard.type(bMonth),
        
        await webPage.focus(siteData.birthYear),
        await webPage.keyboard.type(bYear)
      ]);
      await LOG('Form filling finished');
    } catch (error) {
      await LOG(`Error on form fill: ${error}`);
      stopWaiting(formFilling, (stdClrs.FgRed + "ERROR"));
      await webPage.close();

      status = {
        errorId: 10,
        msg: 'Error on form filling',
        error: error
      }

      break;
    }
    
    await webPage.screenshot({ path: `./capture/${Date.now()}_${formData.username}_${formData.password}_beforeSubmission.png`, fullPage: true });
    await LOG('Submitting filled signup form');
    await webPage.click(siteData.submit);
    await webPage.waitFor(2*1000);

    stopWaiting(formFilling, (stdClrs.FgGreen + "DONE"));

    //#endregion

    //#region Checking Submission State
    
    let checkingSubmission = waiting(msgStart + "Checking Submission State", 500);

    await LOG('Searching for submit state in DOM');
    let submitState = await webPage.evaluate(() => {
      let okDiv = document.querySelectorAll('.ak-register-email-validate'),
          problemDiv = document.querySelectorAll('.ak-register-error');

      if(okDiv.length >= 1){
        return {
          state: 'OK'
        };
      } else if(problemDiv.length >= 1) {
        return {
          state: 'ERROR'
        };
      } else {
        return {
          state: 'UNKNOWN'
        };
      }
    });

    if(submitState.state != 'OK') {
      await LOG('Form was not submitted successfully: ' + JSON.stringify(submitState));
      stopWaiting(checkingSubmission, (stdClrs.FgRed + "ERROR"));

      await webPage.screenshot({ path: `./capture/${Date.now()}_error_${formData.username}_${formData.password}.png`, fullPage: true });
      await webPage.close();
      
      status = {
        errorId: 5,
        msg: 'Submission Error'
      };
      break;
    }
    await LOG('Form submitted successfully');
    await webPage.screenshot({ path: `./capture/${Date.now()}_${formData.username}_${formData.password}_submitted.png`, fullPage: true });
    await LOG('Submitted form page Captured');
    stopWaiting(checkingSubmission, (stdClrs.FgGreen + "DONE"));

    //#endregion

    //#region Form Validation & Logging Out

    let checkingEmail = waiting(msgStart + "Checking Validation Email", 500);
    await LOG('Searching for validation Email')
    let validationLink = await getValidationLink(formData.username.toLowerCase());
    await LOG('Got the validation link: '+ validationLink);
    stopWaiting(checkingEmail, (stdClrs.FgGreen + "DONE"));

    let validateAccount = waiting(msgStart + "Validating Account", 500);
    try {
      await webPage.goto(validationLink, { waitUntil: 'load' });
      await LOG('Account validated');
      await webPage.screenshot({ path: `./capture/${Date.now()}_${formData.username}_${formData.password}_validated.png`, fullPage: true });
      await writeOutputFile(outputFile, `${formData.username}:${formData.password}\n`);
    } catch (error) {
      stopWaiting(validateAccount, (stdClrs.FgRed + "ERROR"));
      await LOG('Error on Account validation: '+error);
      await webPage.screenshot({ path: `./capture/${Date.now()}_${formData.username}_${formData.password}_errorvalidated.png`, fullPage: true });
      await webPage.close();

      status = {
        errorId: 6,
        msg: 'Error on validation',
        error: error
      };
      break;
    }
    stopWaiting(validateAccount, (stdClrs.FgGreen + "DONE"));
    
    
    let loggingOut = waiting(msgStart + "Logging Out", 500);
    await LOG('Logging out of the account');
    await webPage.goto(siteData.appHome, { waitUntil: 'load' });
    if(webPage.url() != siteData.appHome) {
      // console.log('Cloudfare detected', webPage.url());
      await LOG('Logging out not succeeded');
      await webPage.screenshot({ path: `./capture/${Date.now()}_${formData.username}_${formData.password}_errorAfterValidation.png`, fullPage: true });
      await webPage.close();

      stopWaiting(loggingOut, (stdClrs.FgRed + "ERROR"));
      break;
    }
    await webPage.screenshot({ path: `./capture/${Date.now()}_${formData.username}_${formData.password}_homeAfterValidation.png`, fullPage: true });
    
    await webPage.goto(siteData.appLogout, { waitUntil: 'load' });
    await webPage.screenshot({ path: `./capture/${Date.now()}_${formData.username}_${formData.password}_logoutAfterValidation.png`, fullPage: true });
    await LOG('Logged out successfully');
    stopWaiting(loggingOut, (stdClrs.FgGreen + "DONE"));
    
    let deleteMails = waiting(msgStart + "Deleting Validation Email", 500);
    await LOG('Deleting validation mail');
    let mailList = await getAllMails();
    let unsubscribeUrl = null;
    if(mailList.length < 1) {
      console.log('No Mails in inbox');
      await LOG('No mails found for delete');
      stopWaiting(deleteMails, (stdClrs.FgMagenta + "NO MAILS"));
    }else {
      let isDone = false;
      for (let i = 0; i < mailList.length; i++) {
        const element = mailList[i];
        if(element.originalInbox.split('@')[0] == formData.username) {
          await deleteMail(element._id).then(async (conf) => {
            await LOG(`Validation Mail deleted: ${conf}`);
          });
          isDone = true;
          
          element.links.forEach((link) => {
            if(link.split(formData.username).length > 1) {
              unsubscribeUrl = link;
            }
          });
          await LOG(`Unsubscription link was ${unsubscribeUrl?'':'not'} found: ${unsubscribeUrl}`);
        }
      }
      stopWaiting(deleteMails, isDone?(stdClrs.FgGreen + "DONE"):(stdClrs.FgRed + "ERROR"));
    }


    //#endregion

    await LOG(`Account ${page+1} of 3, Created Successfully`);
    console.log(`Account ${page+1} of 3, Created Successfully`);
    await webPage.close();
  }
  await closeBrowser(browser);

  if(status){
    return status;
  }
  return { errorId: 0, msg: 'successfull' };
}

const handleTasks = async () => {
  console.clear();
  let proxyList = [
    
  ];
  if(useProxy) {
    proxyList = await readInputFile(inputFile)
      .catch((err) => {
        console.log(err);
        process.exit(0); 
    });
  }

  let length = proxyList.length;
  length = (length > 0)?length:1;
  for (let i = 0; i < length; i++) {
    let status = await handleFormSubmission(useProxy?{
      proxy: {
        ip: proxyList[i].ip,
        port: proxyList[i].port
      },
      cycles: 3,
      entryNo: i
    } : {
      cycles: 3,
      entryNo: i
    }); 
  }

  return;
}

//#endregion

(async function() {
  var dirs = Object.values(defaultData.dirs);
  for (const dir in defaultData.dirs) {
    if (defaultData.dirs.hasOwnProperty(dir)) {
      const element = defaultData.dirs[dir];
        
      checkDir(element, (err) => {
          console.log('Error Occured', err);
      });
    }
  }
  await delay(2);
  await handleTasks();

  process.exit();
})();
