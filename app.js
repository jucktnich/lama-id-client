import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://supabase.lama-id.de'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzA0NDA5MjAwLAogICJleHAiOiAxODYyMjYyMDAwCn0.r_Iv-w4S5DncSzdO5CSIr0nIdOxG6kQFhzMkxvp6a4A'
const supabase = createClient(supabaseUrl, supabaseKey)

const appEle = document.getElementById("app");
const sessionID = uuidv4();

let currentDisableStatus = [false, false, false];
let user = null;
let userID = null;

function showError(error = 'Fehler beim Laden der Daten. Wenn dieser Fehler häufiger auftritt, kontaktiere bitte den Support.') {
    appEle.innerHTML = `<span class="error">${error}</span>`
}

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function uploadButtonUpdate() {
    if (currentDisableStatus[0] && currentDisableStatus[1] && currentDisableStatus[2]) document.getElementById('upload-button').removeAttribute('disabled');
    else document.getElementById('upload-button').disabled = 'true';
}

function picFinished(pic, frame, size) {
    console.log("Cropping of the picture finished");

    document.getElementById("consent-1").addEventListener('change', (event) => { currentDisableStatus[1] = event.currentTarget.checked; uploadButtonUpdate(); });
    document.getElementById("consent-2").addEventListener('change', (event) => { currentDisableStatus[2] = event.currentTarget.checked; uploadButtonUpdate(); });
    document.getElementById("upload-button").addEventListener('click', () => { uploadPicture(pic, frame, size) })
    currentDisableStatus[0] = true;
    uploadButtonUpdate();
    document.getElementById("photo-upload-img").src = "icons/check.svg"
    document.getElementById("photo-upload-text").innerText = "Foto erfolgreich hinzugefügt"
    document.getElementById("photo-upload-text").style.color = "#49BCFF"
    document.getElementById("photo-upload").classList.add("uploadSuccessful")
}

function closeCanvas() {
    console.log('Closing canvas')
    document.getElementById("crop-canvas").remove()
    document.getElementById("pic-border-container").remove()
    document.body.style.overflowY = 'scroll'
    document.body.style.position = 'relative'
    document.body.style.touchAction = 'auto'
}

function cropPhoto(pic) {
    console.log('Cropping photo');
    console.debug(pic);
    document.querySelector('[id^="b_1urq61qi_"]').children[0].style.zIndex = '990';
    document.body.style.overflowY = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.touchAction = 'none'

    let timeout;
    window.addEventListener("resize", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (document.getElementById("crop-canvas")) {
                console.debug('Resize')
                closeCanvas();
                cropPhoto(pic);
            }
        }, 250);
    })

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let vh = windowHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    console.log(windowHeight, windowWidth)

    appEle.innerHTML += '<canvas id="crop-canvas"></canvas><div class="center-content" id="pic-border-container"><div id="pic-border"></div><button id="pic-border-btn">OK</button></div>'
    const borderDims = document.getElementById("pic-border").getBoundingClientRect();
    document.getElementById("pic-border-btn").addEventListener('click', () => {
        console.debug('CLosing of canvas requested by click')
        let leftPic = ((((windowWidth / 2) - cameraOffset.x) * cameraZoom) - (((windowWidth / 2) - borderDims.left) - ((pic.width * cameraZoom) / 2))) / cameraZoom
        let topPic = ((((windowHeight / 2) - cameraOffset.y) * cameraZoom) - (((windowHeight / 2) - borderDims.top) - ((pic.height * cameraZoom) / 2))) / cameraZoom
        let rightPic = borderDims.width / cameraZoom
        let bottomPic = borderDims.height / cameraZoom
        closeCanvas()
        console.log([leftPic, topPic, rightPic, bottomPic], [pic.width, pic.height], cameraZoom, borderDims, cameraOffset, pic)
        picFinished(pic, [leftPic, topPic, rightPic, bottomPic], [pic.width, pic.height])
    })

    let canvas = document.getElementById("crop-canvas")
    let ctx = canvas.getContext('2d')

    let cameraOffset = { x: windowWidth / 2, y: windowHeight / 2 }
    let cameraZoom = 1
    let MAX_ZOOM = 5
    let MIN_ZOOM = 0
    let SCROLL_SENSITIVITY = 0.0005

    if ((pic.width / pic.height) < 24 / 30) {
        cameraZoom = document.getElementById("pic-border").getBoundingClientRect().width / pic.width;
    } else {
        cameraZoom = document.getElementById("pic-border").getBoundingClientRect().height / pic.height;
    }

    function draw(pic) {
        canvas.width = windowWidth
        canvas.height = windowHeight

        // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
        ctx.translate(windowWidth / 2, windowHeight / 2)
        ctx.scale(cameraZoom, cameraZoom)
        ctx.translate(-windowWidth / 2/* + cameraOffset.x*/, -windowHeight / 2/* + cameraOffset.y*/)
        ctx.clearRect(0, 0, windowWidth, windowHeight)

        ctx.drawImage(pic, cameraOffset.x - ((pic.width) / 2), cameraOffset.y - ((pic.height) / 2));

        requestAnimationFrame(() => { draw(pic) })
    }

    // Gets the relevant location from a mouse or single touch event
    function getEventLocation(e) {
        if (e.touches && e.touches.length == 1) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }
        else if (e.clientX && e.clientY) {
            return { x: e.clientX, y: e.clientY }
        }
    }

    let isDragging = false
    let dragStart = { x: 0, y: 0 }

    function onPointerDown(e) {
        if (!getEventLocation(e)) return;
        isDragging = true
        dragStart.x = getEventLocation(e).x / cameraZoom - cameraOffset.x
        dragStart.y = getEventLocation(e).y / cameraZoom - cameraOffset.y
    }

    function onPointerUp(e) {
        isDragging = false
        initialPinchDistance = null
        lastPosX = [null, null]
        lastPosY = [null, null]
        lastZoom = cameraZoom
    }

    function onPointerMove(e) {
        if (!getEventLocation(e)) return;
        if (isDragging) {
            cameraOffset.x = getEventLocation(e).x / cameraZoom - dragStart.x
            cameraOffset.y = getEventLocation(e).y / cameraZoom - dragStart.y
        }
    }

    function handleTouch(e, singleTouchHandler) {
        if (e.touches.length == 1) {
            singleTouchHandler(e)
        }
        else if (e.type == "touchmove" && e.touches.length == 2) {
            isDragging = false
            handlePinch(e)
        }
    }

    let initialPinchDistance = null
    let lastPosX = [null, null]
    let lastPosY = [null, null]
    let lastZoom = cameraZoom

    function handlePinch(e) {
        e.preventDefault()

        let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

        if ((lastPosX[0] !== null) && (lastPosX[0] > touch1.x && lastPosX[1] > touch2.x) || (lastPosX[0] < touch1.x && lastPosX[1] < touch2.x)) {
            let change = (((touch1.x - lastPosX[0]) + (touch2.x - lastPosX[1])) / 2) / cameraZoom
            change = Math.min(change, 20)
            change = Math.max(change, -20)
            cameraOffset.x += change
        }
        lastPosX[0] = touch1.x
        lastPosX[1] = touch2.x

        if ((lastPosY[0] !== null) && (lastPosY[0] > touch1.y && lastPosY[1] > touch2.y) || (lastPosY[0] < touch1.y && lastPosY[1] < touch2.y)) {
            let change = (((touch1.y - lastPosY[0]) + (touch2.y - lastPosY[1])) / 2) / cameraZoom
            change = Math.min(change, 20)
            change = Math.max(change, -20)
            cameraOffset.y += change
        }
        lastPosY[0] = touch1.y
        lastPosY[1] = touch2.y

        // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
        let currentDistance = (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2

        if (initialPinchDistance == null) {
            initialPinchDistance = currentDistance
        }
        else {
            let zoomChange = currentDistance / initialPinchDistance
            adjustZoom(null, zoomChange)
        }
    }

    function adjustZoom(zoomAmount, zoomFactor) {
        if (!isDragging) {
            if (zoomAmount) {
                cameraZoom *= zoomAmount
            }
            else if (zoomFactor) {
                cameraZoom = zoomFactor * lastZoom
            }

            //cameraZoom = Math.min(cameraZoom, MAX_ZOOM)
            cameraZoom = Math.max(cameraZoom, MIN_ZOOM)
        }
    }

    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('touchend', (e) => handleTouch(e, onPointerUp))
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
    canvas.addEventListener('wheel', (e) => adjustZoom((1 + (e.deltaY * SCROLL_SENSITIVITY))))

    draw(pic)
}

function validate() {
    console.log('Validating uploaded file...')
    let URL = window.URL || window.webkitURL;
    let input = document.getElementById("file-upload");
    let file = input.files[0];

    if (file) {
        var image = new Image();

        image.onload = function () {
            if (this.width) {
                console.log('First uploaded file is an image');
                cropPhoto(this)
            } else {
                console.warn('First uploaded file is NOT an image');
                currentDisableStatus[0] = false;
                uploadButtonUpdate();
                input.value = null;
            }
        };

        image.src = URL.createObjectURL(file);
    }
};

function uploadSuccessfulScreen() {
    window.scrollTo(0, 0);
    appEle.innerHTML = `<div class="upload-successfull">
    <div><img style="width: 5em;" src="icons/check.svg"></div>
    <p class="upload-successfull-text">Vielen Dank für Deinen Upload!</p>
    <p class="upload-successfull-text">Sobald das Foto geprüft wurde, wird Dein Ausweis gedruckt und über die Schule ausgeliefert.</p>
    <div><button id="go-to-status" style="padding: 1em">Foto ansehen und Status prüfen</button></div>
    </div>`
    document.getElementById("go-to-status").addEventListener('click', statusScreen)
}

async function uploadPicture(pic, frame, size) {
    console.log("Uploading picture")
    document.getElementById("upload-button").disabled = "true";
    document.getElementById("upload-button").innerText = "Lädt...";
    let c = document.createElement("canvas"),
        ctx = c.getContext("2d");
    c.width = pic.width;
    c.height = pic.height;
    ctx.drawImage(pic, 0, 0);
    c.toBlob(async (blob) => {
        let converted = new File([blob], "converted.jpg", { type: "image/jpeg" });
        /*if (converted.size < 500) {
            converted = new FileReader().readAsText(document.getElementById("file-upload").files[0])
        }*/
        const id = uuidv4();
        const { error: uploadError } = await supabase
            .storage
            .from('pictures')
            .upload(userID + '/' + id + '.jpg', converted, {
                cacheControl: '3600',
                upsert: false
            })
        if (uploadError) {
            console.warn(uploadError);
            showError('Fehler beim Upload des Fotos. Wenn dieser Fehler häufiger auftritt, kontaktiere bitte den Support.');
            return;
        }
        const { error: pictureListError } = await supabase
            .from('picture_list')
            .insert({ picture_id: id, user_id: userID, frame: frame, size: size })
        if (pictureListError) {
            console.warn(pictureListError);
            showError();
            return;
        }
        uploadSuccessfulScreen()
    }, "image/jpeg", 1);
}

function uploadPictureScreen() {
    window.scrollTo(0, 0);
    console.log('Upload picture screen')
    appEle.innerHTML = `<div style="max-width: calc(100vw - 3em);"><h1>Foto-Upload</h1>
    <div><div class="grid-w-line">
    <label id="photo-upload" class="photo-upload">
    <div class="center-content"><img style="width: 4.5em" id="photo-upload-img" src="icons/add-a-photo.svg"></div>
    <div class="center-content"><span id="photo-upload-text">Foto hier hinziehen oder<br>klicken zum auswählen</span></div>
    <!--<img src="icons/circle-button.png" id="explainer-button">-->
    <input type="file" id="file-upload"></label>
    <div id="explainer"><h2>Bitte achte auf folgende Vorgaben an Dein Foto</h2>
    <ul style="padding-left: 1.25em;"><li>ausreichende Fotogröße und -Auflösung</li>
    <li>das Gesicht sollte gut erkennbar sein, kein Schatten im Gesicht</li>
    <li>keine Kunstfilter wie Schwarz-Weiß- oder Farbeffekte</li>
    <li>keine "Snapchat-Filter" wie Hasenohren o.ä.</li>
    <li>keine Accessoires wie Sonnenbrillen, Mützen, etc.</li>
    <li>keine Fotos mit mehr als einer Person</li>
    </div></div>
    <details>
    <summary>Bitte achte auf folgende Vorgaben an Dein Foto</summary>
    <ul style="padding-left: 1.25em;"><li>ausreichende Fotogröße und -Auflösung</li>
    <li>das Gesicht sollte gut erkennbar sein, kein Schatten im Gesicht</li>
    <li>keine Kunstfilter wie Schwarz-Weiß- oder Farbeffekte</li>
    <li>keine "Snapchat-Filter" wie Hasenohren o.ä.</li>
    <li>keine Accessoires wie Sonnenbrillen, Mützen, etc.</li>
    <li>keine Fotos mit mehr als einer Person</li>
    </details>
    <br>
    <div class="lr"><label class="switch"><input type="checkbox" id="consent-1"><span class="slider round"></span></label><span>Ich erteile meiner Schule die Vollmacht, im Falle von Problemen meine Kontakt-Daten an Lama-ID auszuhändigen.</span></div><br>
    <div class="lr"><label class="switch"><input type="checkbox" id="consent-2"><span class="slider round"></span></label><span>Ich habe die Datenschutz-Bedingungen zum Foto-Upload gelesen und bin einverstanden.</span></div></div>
    <div class="center-content"><button id="upload-button" disabled>Foto hochladen</button></div></div>`
    const photoUpload = document.getElementById("photo-upload")
    photoUpload.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
    })
    photoUpload.addEventListener('drop', (ev) => {
        ev.preventDefault();
        let container = new DataTransfer();
        [...ev.dataTransfer.files].map(file => container.items.add(file));
        document.getElementById("file-upload").files = container.files;
        validate();
    })
    document.getElementById("consent-1").addEventListener('change', (event) => { currentDisableStatus[1] = event.currentTarget.checked; uploadButtonUpdate(); })
    document.getElementById("consent-2").addEventListener('change', (event) => { currentDisableStatus[2] = event.currentTarget.checked; uploadButtonUpdate(); })
    document.getElementById("file-upload").addEventListener('change', validate)
    document.getElementById("upload-button").addEventListener('click', uploadPicture)
}

async function statusScreen() {
    window.scrollTo(0, 0);
    appEle.innerHTML = '<div id="status-container"><span id="entries-loading">Einträge werden geladen...</span></div>';
    const statusContainer = document.getElementById("status-container");

    let { data: pictureList, error: pictureListError } = await supabase
        .from('picture_list')
        .select()
        .eq('user_id', userID)
        .order('created_at', { ascending: false });
    if (pictureListError) {
        console.warn(pictureListError);
        showError();
        return;
    }

    const { data: verified, error: verifiedError } = await supabase
        .from('verified_pictures')
        .select()
        .eq('user_id', userID)
    if (verifiedError) {
        console.warn(verifiedError);
        showError();
        return;
    }

    outer:
    for (let i = 0; i < verified.length; i++) {
        for (let j = 0; j < pictureList.length; j++) {
            if (pictureList[j].picture_id === verified[i].picture_id) {
                pictureList[j].status = verified[i].status;
                pictureList[j].rejection_reason = verified[i].rejection_reason;
                continue outer;
            }
        };
    }

    console.log('Showing the status with following pictures', pictureList);
    for (let i = 0; i < pictureList.length; i++) {
        let mrStatus;
        if (i === 0) mrStatus = 'UPLOADED'
        else mrStatus = 'WITHDRAWN'
        if (pictureList[i].status !== undefined) {
            mrStatus = pictureList[i].status
            if (mrStatus === "UPLOADED" && i !== 0) mrStatus = 'WITHDRAWN';
        }
        const { data: file, error: fileError } = await supabase
            .storage
            .from('pictures')
            .download(`${userID}/${pictureList[i].picture_id}.jpg`)
        if (fileError) {
            console.warn(fileError);
            showError();
            return;
        }
        let imageUrl = URL.createObjectURL(file);
        let frame = pictureList[i].frame
        let width = pictureList[i].size[0]
        let height = pictureList[i].size[1]
        let status, color;
        if (mrStatus === 'UPLOADED' || mrStatus === 'CLARIFICATION') { status = 'Foto hochgeladen'; color = '#95E567'; }
        else if (mrStatus === 'WITHDRAWN') { status = 'Foto gelöscht'; color = '#bbb'; }
        else if (mrStatus === 'ACCEPTED') { status = 'Druckvorbereitung'; color = '#FFEB8A'; }
        else if (mrStatus === 'REJECTED') { status = 'Foto fehlerhaft'; color = '#FFA99F'; }
        else if (mrStatus === 'PRINTED') { status = 'Gedruckt'; color = '#49BCFF'; }
        document.getElementById("entries-loading").remove()
        if (i === 0 && (mrStatus === 'UPLOADED' || mrStatus === 'REJECTED')) {
            statusContainer.innerHTML += '<button disabled id="new-picture-button">Neues Foto hochladen</button>';
        }
        statusContainer.innerHTML += `<div style="display: flex;">
        <div class="status-div">
        <img class="status-img" src="${imageUrl}" style="margin-top: ${-(4.4 / frame[3]) * frame[1]}em; height: ${(4.4 / frame[3]) * height}em; margin-left: ${-(3.52 / frame[2]) * frame[0]}em; width: ${((3.52 / frame[2]) * width)}em; clip-path: polygon(${(frame[0] / width) * 100}% ${(frame[1] / height) * 100}%, ${((frame[2] + frame[0]) / width) * 100}% ${(frame[1] / height) * 100}%, ${((frame[2] + frame[0]) / width) * 100}% ${((frame[3] + frame[1]) / height) * 100}%, ${((frame[0] / width) * 100)}% ${((frame[3] + frame[1]) / height) * 100}%);">
        <div>
        <span>Schülerausweis 20${user.public_id.toString().slice(3, 5)}</span>
        <br>
        <span>${user.class.name}, ${user.school.name}</span>
        <br>
        <span><b>Foto vom:</b> ${new Date(pictureList[i].created_at).toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p class="status" style="background: ${color};">${status}</p>
        </div>`;
        if (pictureList[i].rejection_reason) statusContainer.innerHTML += `<div style="display: grid; grid-template-columns: auto auto;"><div></div><div class="error"><img src="icons/warning.svg"><span class="rejection-error"><b>Foto wurde abgelehnt:</b><br>${pictureList[i].rejection_reason}</span></div></div>`
        statusContainer.innerHTML += '</div>'
        if (i !== pictureList.length - 1) {
            statusContainer.innerHTML += '<span id="entries-loading">Einträge werden geladen...</span>'
        } else {
            try {
                document.getElementById('new-picture-button').addEventListener('click', function () { uploadPictureScreen() });
                document.getElementById('new-picture-button').removeAttribute("disabled")
            } catch {
                console.debug('No new pic button')
            }
        }
    }
}

async function loggedIn() {
    console.log(navigator.userAgent);
    const { data: pictureList, error } = await supabase
        .from('picture_list')
        .select()
        .eq('user_id', userID)
    if (error) {
        console.warn(error);
        showError();
        return;
    }

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*, class:class_id(*), school:school_id(*)')
        .eq('id', userID);
    if (userError) {
        console.warn(userError);
        showError();
        return;
    }
    user = users[0]
    if (!user) {
        console.warn('User is empty');
        showError();
        return;
    }
    console.log('User data fetched', user);

    document.getElementById("username-span").innerText = user.first_name + " " + user.last_name;

    if (pictureList.length === 0) {
        console.log('No picture uploaded -> showing Upload Picture Screen');
        uploadPictureScreen();
    } else {
        console.log('There was already a picture uploaded -> showing Status Screen. Picture List:', pictureList);
        statusScreen();
    }
}

async function logUserIn() {
    document.getElementById("login").disabled = "true";
    document.getElementById("login").innerText = "Anmelden...";
    const { data, error } = await supabase.auth.signInWithPassword({
        email: document.getElementById('id-input').value + '@lama-id.de',
        password: document.getElementById('password').value,
    });
    if (error) {
        console.warn(error);
        document.getElementById("login").removeAttribute('disabled')
        document.getElementById("login").innerText = "Anmelden";
        document.getElementById('login-error').style.display = 'grid';
    } else {
        userID = data.user.id;
        console.log('Successful login. ID is', userID);
        document.getElementById('login-div').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        loggedIn();
    }
}

function showDoc(type) {
    window.scrollTo(0, 0);
    const docs = {
        "imprint": `<p style="text-align: center;">
        <strong>Impressum</strong></p>
        <p><strong><br />Diensteanbieter gemäß § 5 des Telemediengesetzes</strong></p>
        <p> Lamarketing e.K.</p> <p> Andreas Vogt</p>
        <p><strong><br />Anschrift & Kontaktdaten</strong></p>
        <p> Jahnstraße 16<br />71729 Erdmannhausen</p>
        <p> Telefon: <a href=tel:+49714450793800">07144-50793800</a> &#40;kein Support&#41;<br />Fax: 07144-50793805 &#40;kein Support&#41;<br />Mail: <a href="mailto:team@agentur-lamarketing.de">team@agentur-lamarketing.de</a> &#40;kein Support&#41;</p>
        <p><strong><br />Handelsregister</strong></p>
        <p> Amtsgericht Stuttgart - HRA 736763</p> <p><strong><br />Umsatzsteuer-Identifikationsnummer</strong></p> <p> DE316866376</p>
        <p><strong><br />Streitbeilegung</strong></p>
        <p>Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht bereit und nicht verpflichtet.</p>
        <p><strong><br />Berufshaftpflichtversicherung</strong></p>
        <p> SV SparkassenVersicherung Holding AG<br />Löwentorstraße 65<br />70376 Stuttgart</p>`,

        "gdpr": `<p style="text-align: center;"><strong>Datenschutzerklärung</strong></p>
        <p><br />Nachfolgend informieren wir Sie über die Verarbeitung Ihrer personenbezogenen Daten im Rahmen der Nutzung unseres Online-Angebots.</p>
        <p><strong><br />Verantwortlicher</strong></p>
        <p> Den Namen und die Kontaktdaten des Verantwortlichen finden Sie im Impressum. </p>
        <p><strong><br />Ansprechpartner</strong></p>
        <p> Bei Fragen zum Datenschutz wenden Sie sich bitte an die im Impressum angegebenen Kontaktdaten. </p>
        <p><strong><br />Speicherdauer</strong></p>
        <p>Wir löschen Ihre personenbezogenen Daten grundsätzlich dann, wenn diese für die Zwecke, für die sie erhoben oder auf sonstige Weise verarbeitet wurden, nicht mehr notwendig sind.</p>
        <p>Falls wir Sie um Ihre Einwilligung gebeten und Sie diese erteilt haben, löschen wir Ihre personenbezogenen Daten, wenn Sie Ihre Einwilligung widerrufen und es an einer anderweitigen Rechtsgrundlage für die Verarbeitung fehlt.</p>
        <p>Wir löschen Ihre personenbezogenen Daten, wenn Sie Widerspruch gegen die Verarbeitung einlegen und keine vorrangigen berechtigten Gründe für die Verarbeitung vorliegen oder Sie Widerspruch gegen die Verarbeitung zum Zwecke der Direktwerbung oder eines damit in Verbindung stehenden Profiling einlegen.</p>
        <p>Ist eine Löschung nicht möglich, weil eine Verarbeitung noch zur Erfüllung einer rechtlichen Verpflichtung (gesetzliche Aufbewahrungsfristen etc.), der wir unterliegen, oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist, schränken wir die Verarbeitung Ihrer personenbezogenen Daten ein.</p>
        <p>Weitere Informationen zur Speicherdauer finden Sie auch in den nachfolgenden Passagen.</p>
        <p><strong><br />Ihre Rechte</strong></p>
        <p>Sie haben uns gegenüber folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:<br /> - Recht auf Auskunft<br /> - Recht auf Berichtigung<br /> - Recht auf Löschung<br /> - Recht auf Einschränkung der Verarbeitung<br /> - Recht auf Widerspruch gegen die Verarbeitung<br /> - Recht auf Datenübertragbarkeit </p>
        <p style="background-color: #cccccc; padding: 15px;"><strong> Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Ihrer personenbezogenen Daten, die aufgrund von Artikel 6 Abs. 1 lit. e oder f DS-GVO erfolgt, Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling. Wir verarbeiten Ihre personenbezogenen Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen. <br /> Falls wir Ihre personenbezogenen Daten verarbeiten, um Direktwerbung zu betreiben, haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Wir werden Ihre personenbezogenen Daten dann nicht mehr für diese Zwecke verarbeiten. </strong> </p>
        <p>Sie haben das Recht, eine Einwilligung zur Verarbeitung Ihrer personenbezogenen Daten jederzeit zu widerrufen, falls Sie uns eine solche Einwilligung erteilt haben. Durch den Widerruf der Einwilligung wird die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung nicht berührt.</p>
        <p>Sie haben das Recht, sich bei einer Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.</p>
        <p><strong><br />Bereitstellung Ihrer personenbezogenen Daten</strong></p>
        <p>Die Bereitstellung Ihrer personenbezogenen Daten ist grundsätzlich weder gesetzlich noch vertraglich vorgeschrieben und nicht für einen Vertragsabschluss erforderlich. Sie sind grundsätzlich nicht verpflichtet, Ihre personenbezogenen Daten bereitzustellen. Soweit dies dennoch einmal der Fall sein sollte, weisen wir Sie bei Erhebung Ihrer personenbezogenen Daten gesondert darauf hin (beispielsweise durch Kennzeichnung der Pflichtfelder bei Eingabeformularen).</p>
        <p>Die Nichtbereitstellung Ihrer personenbezogenen Daten hat regelmäßig zur Folge, dass wir Ihre personenbezogenen Daten nicht für einen der nachfolgend beschriebenen Zwecke verarbeiten und Sie ein mit der jeweiligen Verarbeitung zusammenhängendes Angebot nicht wahrnehmen können (Beispiel: Ohne Bereitstellung Ihrer E-Mail-Adresse erhalten Sie unseren Newsletter nicht).</p>
        <p><strong><br />Webhosting</strong></p>
        <p>Zum Webhosting setzen wir externe Dienste ein. Diese Dienste können Zugriff auf personenbezogene Daten haben, die im Rahmen der Nutzung unseres Online-Angebots verarbeitet werden.</p>
        <p><strong><br />Webserver-Logfiles</strong></p>
        <p>Wir verarbeiten Ihre personenbezogenen Daten, um Ihnen unser Online-Angebot anzeigen zu können und die Stabilität und Sicherheit unseres Online-Angebots zu gewährleisten. Dabei werden Informationen (beispielsweise angefragtes Element, aufgerufene URL, Betriebssystem, Datum und Uhrzeit der Anfrage, Browsertyp und die verwendete Version, IP-Adresse, verwendetes Protokoll, übertragene Datenmenge, User Agent, Referrer URL, Zeitzonendifferenz zur Greenwich Mean Time (GMT) und/oder HTTP-Statuscode) in sogenannten Logfiles (Access-Log, Error-Log etc.) gespeichert.</p>
        <p>Falls wir Sie um Ihre Einwilligung gebeten und Sie diese erteilt haben, ist die Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 lit. a DS-GVO. Falls wir Sie nicht um Ihre Einwilligung gebeten haben, ist die Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 lit. f DS-GVO. Unser berechtigtes Interesse ist dabei die ordnungsgemäße Anzeige unseres Online-Angebots und die Gewährleistung der Stabilität und Sicherheit unseres Online-Angebots.</p>
        <p><strong><br />Sicherheit</strong></p>
        <p>Aus Sicherheitsgründen und zum Schutz der Übertragung Ihrer personenbezogenen Daten und anderer vertraulicher Inhalte setzen wir auf unserer Domain eine Verschlüsselung ein. Dies können Sie in der Browserzeile an der Zeichenfolge „https://“ und dem Schloss-Symbol erkennen.</p>
        <p>Wir nutzen Firewalls und Malware-Scanner von externen Diensten, um die Sicherheit unseres Online-Angebots zu gewährleisten.</p>
        <p>Falls wir Sie um Ihre Einwilligung gebeten und Sie diese erteilt haben, ist die Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 lit. a DS-GVO. Falls wir Sie nicht um Ihre Einwilligung gebeten haben, ist die Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 lit. f DS-GVO. Unser berechtigtes Interesse ist dabei die Sicherheit unseres Online-Angebots.</p>
        <p>Im Rahmen der Nutzung der externen Dienste kann es auch zum Profiling (zu Zwecken der Werbung, personalisierten Information etc.) kommen. Das Profiling kann auch dienst- und geräteübergreifend erfolgen. Weitere Informationen zu den eingesetzten Diensten, zum Umfang der Datenverarbeitung und zu den Technologien und Verfahren beim Einsatz der jeweiligen Dienste sowie dazu, ob beim Einsatz der jeweiligen Dienste Profiling stattfindet, und ggf. Informationen über die involvierte Logik sowie die Tragweite und die angestrebten Auswirkungen einer derartigen Verarbeitung für Sie finden Sie in den weiterführenden Informationen über die von uns eingesetzten Dienste am Ende dieser Passage und unter den dort bereitgestellten Links.</p>
        <p><strong><br />Kontaktaufnahme</strong></p>
        <p>Falls Sie mit uns Kontakt aufnehmen, verarbeiten wir Ihre personenbezogenen Daten, um Ihre Kontaktaufnahme zu bearbeiten.</p>
        <p>Falls wir Sie um Ihre Einwilligung gebeten und Sie diese erteilt haben, ist die Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 lit. a DS-GVO. Falls wir Sie nicht um Ihre Einwilligung gebeten haben, ist die Rechtsgrundlage für die Verarbeitung Art. 6 Abs. 1 lit. f DS-GVO. Unser berechtigtes Interesse ist dabei die Bearbeitung Ihrer Kontaktaufnahme. Falls die Verarbeitung zur Erfüllung eines Vertrags mit Ihnen oder zur Durchführung vorvertraglicher Maßnahmen aufgrund Ihrer Anfrage erforderlich ist, ist die Rechtsgrundlage für die Verarbeitung zudem Art. 6 Abs. 1 lit. b DS-GVO.</p>
        <p>Zur Bereitstellung und Pflege unserer E-Mail-Postfächer setzen wir externe Dienste ein. Diese Dienste können Zugriff auf personenbezogene Daten haben, die im Rahmen der Kontaktaufnahme mit uns verarbeitet werden. Weitere Informationen zu den eingesetzten Diensten, zum Umfang der Datenverarbeitung und zu den Technologien und Verfahren beim Einsatz der jeweiligen Dienste finden Sie nachfolgend in den weiterführenden Informationen über die von uns eingesetzten Dienste und unter den dort bereitgestellten Links:</p>
        <p> <u>Microsoft Exchange</u><br /> Anbieter: Microsoft Ireland Operations Limited, Irland. Die Microsoft Ireland Operations Limited ist eine Tochtergesellschaft der Microsoft Corporation, Vereinigte Staaten von Amerika.<br /> Website: <a href="https://www.microsoft.com/de-de/microsoft-365/exchange/email" target="new">https://www.microsoft.com/de-de/microsoft-365/exchange/email</a><br /> Weitere Informationen & Datenschutz: <a href="https://privacy.microsoft.com/de-de/" target="new">https://privacy.microsoft.com/de-de/</a> und <a href="https://www.microsoft.com/de-de/trust-center/privacy" target="new">https://www.microsoft.com/de-de/trust-center/privacy</a> <br />Garantie: EU-Standardvertragsklauseln. Eine Kopie der EU-Standardvertragsklauseln können Sie bei uns anfordern. Der Anbieter hat sich dem EU-US Data Privacy Framework (<a href="https://www.dataprivacyframework.gov" target="new">https://www.dataprivacyframework.gov</a>) angeschlossen, das auf Basis eines Beschlusses der Europäischen Kommission die Einhaltung eines angemessenen Datenschutzniveaus gewährleistet. </p>`,
    };
    document.getElementById('doc').innerHTML = `<button id="close-button" style="position: absolute; top: 1.5em; right: 1.5em;" aria-label="Schließen">×</button>${docs[type]}`;
    document.getElementById('doc').style.display = 'block';
    document.getElementById('close-button').addEventListener("click", () => {
        document.getElementById('doc').style.display = 'none';
    })
}

window.scrollTo(0, 0);
document.getElementById("login").addEventListener("click", logUserIn)
document.getElementById("imprint").addEventListener("click", () => { showDoc("imprint") })
document.getElementById("gdpr").addEventListener("click", () => { showDoc("gdpr") })
document.getElementById("app-logo").addEventListener("click", () => { window.location.reload(); })
document.addEventListener("keypress", (event) => {
    if (event.key === 'Enter' && !userID && document.getElementById('password').value) {
        logUserIn()
    }
});

const logLevel = new URLSearchParams(window.location.search).get('logLevel');
function createLogBindings() {
    if (!logLevel) return
    let errorBind = console.error.bind(console);
    let warnBind = console.warn.bind(console);
    let logBind = console.log.bind(console);
    let debugBind = console.warn.bind(console);

    console.error = async (text, json) => {
        await supabase
            .from('logs')
            .insert({ created_at: new Date(), session_id: sessionID, user_id: userID, type: 'ERROR', log: text + ' ' + JSON.stringify(json) })
        errorBind(text, json);
    }
    if (logLevel === 'error') return
    console.warn = async (text, json) => {
        await supabase
            .from('logs')
            .insert({ created_at: new Date(), session_id: sessionID, user_id: userID, type: 'WARN', log: text + ' ' + JSON.stringify(json) })
        warnBind(text, json);
    }
    if (logLevel === 'warn') return
    console.log = async (text, json) => {
        await supabase
            .from('logs')
            .insert({ created_at: new Date(), session_id: sessionID, user_id: userID, type: 'LOG', log: text + ' ' + JSON.stringify(json) })
        logBind(text, json);
    }
    if (logLevel === 'log') return
    console.debug = async (text, json) => {
        await supabase
            .from('logs')
            .insert({ created_at: new Date(), session_id: sessionID, user_id: userID, type: 'DEBUG', log: text + ' ' + JSON.stringify(json) })
        debugBind(text, json);
    }
}
createLogBindings()