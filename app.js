import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://supabase.lama-id.de'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzA0NDA5MjAwLAogICJleHAiOiAxODYyMjYyMDAwCn0.r_Iv-w4S5DncSzdO5CSIr0nIdOxG6kQFhzMkxvp6a4A'
const supabase = createClient(supabaseUrl, supabaseKey)

const appEle = document.getElementById("app")

let currentDisableStatus = [false, false, false];
let userId = null;

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function uploadButtonUpdate() {
    if (currentDisableStatus[0] && currentDisableStatus[1] && currentDisableStatus[2]) document.getElementById('upload-button').removeAttribute('disabled');
    else document.getElementById('upload-button').disabled = 'true';
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
                currentDisableStatus[0] = true;
                uploadButtonUpdate();
                document.getElementById("photo-upload-img").src = "icons/check.svg"
                document.getElementById("photo-upload-text").innerText = ""
                document.getElementById("photo-upload").classList.add("uploadSuccessful")
            } else {
                console.warn('First uploaded file is NOT an image');
                currentDisableStatus[0] = false;
                uploadButtonUpdate();
            }
        };

        image.src = URL.createObjectURL(file);
    }
};

function uploadSuccessfulScreen() {
    window.scrollTo(0, 0);
    appEle.innerHTML = `<div class="upload-successfull"><div><img style="width: 5em;" src="icons/check.svg"></div><p class="upload-successfull-text">Vielen Dank für Deinen Upload!</p><p class="upload-successfull-text">Sobald das Bild geprüft wurde, wird Dein Ausweis gedruckt und über die Schule ausgeliefert.</p><div><button id="go-to-status" style="padding: 1em">Foto ansehen und Status prüfen</button></div></div>`
    document.getElementById('go-to-status').addEventListener('click', statusScreen)
}

async function uploadPicture() {
    console.log("Uploading picture")
    let URL = window.URL || window.webkitURL;
    let input = document.getElementById("file-upload");
    let file = input.files[0];

    if (file) {
        var image = new Image();

        image.onload = function () {
            if (this.width) {
                let c = document.createElement("canvas"),
                    ctx = c.getContext("2d");
                c.width = this.width;
                c.height = this.height;
                ctx.drawImage(this, 0, 0);
                c.toBlob(async (blob) => {
                    let converted = new File([blob], "converted.jpg", { type: "image/jpeg" });
                    let id = uuidv4();
                    let { data, error } = await supabase
                        .storage
                        .from('pictures')
                        .upload(userId + '/' + id + '.jpg', converted, {
                            cacheControl: '3600',
                            upsert: false
                        })
                    if (error) { alert("Fehler beim Upload"); return; }
                    await supabase
                        .from('picture_list')
                        .insert({ picture_id: id, user: userId })
                    uploadSuccessfulScreen()
                }, "image/jpeg", 1);
            } else {
                console.warn('First uploaded file is NOT an image');
            }
        };

        image.src = URL.createObjectURL(file);
    }
}

function uploadPictureScreen() {
    window.scrollTo(0, 0);
    console.log('Upload picture screen')
    appEle.innerHTML = `<div><h1>Foto-Upload</h1>
    <div><div class="grid-w-line"><label id="photo-upload" class="photo-upload">
    <div class="center-content"><img style="width: 4.5em" id="photo-upload-img" src="icons/add-a-photo.svg"></div>
    <div class="center-content"><span id="photo-upload-text">Foto hier hinziehen oder<br>klicken zum auswählen</span></div>
    <input type="file" id="file-upload"></label>
    <div id="explainer"><h2>Bitte achte auf folgende Vorgaben an Dein Foto</h2>
    <ul style="padding-left: 1.25em;"><li>ausreichende Fotogröße und -Auflösung</li>
    <li>das Gesicht sollte gut erkennbar sein, kein Schatten im Gesicht</li>
    <li>keine Kunstfilter wie Schwarz-Weiß- oder Farbeffekte</li>
    <li>keine "Snapchat-Filter" wie Hasenohren o.ä.</li>
    <li>keine Accessoires wie Sonnenbrillen, Mützen, etc.</li>
    <li>keine Fotos mit mehr als einer Person</li>
    </div></div>
    <br>
    <div class="lr"><label class="switch"><input type="checkbox" id="consent-1"><span class="slider round"></span></label><span>Ich erteile meiner Schule die Vollmacht, im Falle von Problemen meine Kontakt-Daten an Lama-ID auszuhändigen.</span></div><br>
    <div class="lr"><label class="switch"><input type="checkbox" id="consent-2"><span class="slider round"></span></label><span>Ich habe die Datenschutz-Bedingungen zum Foto-Upload gelesen und bin einverstanden.</span></div></div>
    <div class="center-content"><button id="upload-button" disabled>Bild hochladen</button></div></div>`
    document.getElementById("photo-upload").addEventListener('dragover', (ev) => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
    })
    document.getElementById("photo-upload").addEventListener('drop', (ev) => {
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
    appEle.innerHTML = '<div id="status-container"></div>';
    const statusContainer = document.getElementById("status-container")
    let { data, error } = await supabase
        .from('picture_list')
        .select()
        .eq('user', userId)
        .order('created_at', { ascending: false })
    const { data: verified, error: verifiedError } = await supabase
        .from('verified_pictures')
        .select()
        .eq('user_id', userId)
    outer:
    for (let i = 0; i < verified.length; i++) {
        for (let j = 0; j < data.length; j++) {
            if (data[j].picture_id === verified[i].picture_id) { data[j].status = verified[i].status; data[j].rejection_reason = verified[i].rejection_reason; continue outer; }
        };
    }
    let { data: user, error: userError } = await supabase
        .from('users')
        .select()
        .eq('id', userId)
    user = user[0]
    let { data: userClass, error: classError } = await supabase
        .from('classes')
        .select()
        .eq('id', user.class)
    userClass = userClass[0]
    let { data: school, error: schoolError } = await supabase
        .from('schools')
        .select()
        .eq('id', userClass.school)
    school = school[0]
    console.log(data)
    for (let i = 0; i < data.length; i++) {
        let mrStatus;
        if (i === 0) mrStatus = 'UPLOADED'
        else mrStatus = 'WITHDRAWN'
        if (data[i].status !== undefined) {
            mrStatus = data[i].status
        }
        const { data: file, error: fileError } = await supabase
            .storage
            .from('pictures')
            .download(`${userId}/${data[i].picture_id}.jpg`)
        let imageUrl = URL.createObjectURL(file);
        let status, color;
        if (mrStatus === 'UPLOADED' || mrStatus === 'CLARIFICATION') { status = 'Foto hochgeladen'; color = '#95E567'; }
        else if (mrStatus === 'WITHDRAWN') { status = 'Foto gelöscht'; color = '#bbb'; }
        else if (mrStatus === 'ACCEPTED') { status = 'Druckvorbereitung'; color = '#FFEB8A'; }
        else if (mrStatus === 'REJECTED') { status = 'Foto fehlerhaft'; color = '#FFA99F'; }
        else if (mrStatus === 'PRINTED') { status = 'Gedruckt'; color = '#49BCFF'; }
        if (i === 0 && (mrStatus === 'UPLOADED' || mrStatus === 'REJECTED')) { statusContainer.innerHTML += '<button id="new-picture-button">Neues Bild hochladen</button>'; }
        statusContainer.innerHTML += `<div style="display: flex;"><div class="status-div"><img class="status-img" src="${imageUrl}"><div><span>Schülerausweis 20${user.public_id.toString().slice(3,5)}</span><br><span>${userClass.name}, ${school.name}</span><br><span><b>Bild vom:</b> ${new Date(data[i].created_at).toLocaleString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div><p class="status" style="background: ${color};">${status}</div>`;
        if (data[i].rejection_reason) statusContainer.innerHTML += `<div style="display: grid; grid-template-columns: auto auto;"><div></div><div class="error"><img src="icons/warning.svg"><span class="rejection-error"><b>Foto wurde abgelehnt:</b><br>${data[i].rejection_reason}</span></div></div>`
        statusContainer.innerHTML += '</div>'
        try {
            document.getElementById('new-picture-button').addEventListener('click', uploadPictureScreen);
        } catch {
            console.debug('No new pic button')
        }
    }
}

async function loggedIn() {
    const { data, error } = await supabase
        .from('picture_list')
        .select()
        .eq("user", userId)
    console.log(data)
    if (error) {
        console.warn(error)
        appEle.innerHTML = '<span class="error">Fehler beim Laden der Daten. Wenn dieser Fehler häufiger auftritt, kontaktiere bitte den Support.</span>'
        return;
    }
    if (data.length === 0) {
        console.log('No picture uploaded');
        uploadPictureScreen()
    } else {
        console.log('Already a picture uploaded');
        statusScreen()
    }
}

async function logUserIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: document.getElementById('email').value + '@lama-id.de',
        password: document.getElementById('password').value,
    });
    if (error) {
        console.warn(error);
        document.getElementById('login-error').style.display = 'grid';
    } else {
        console.log('Successful login')
        userId = data.user.id;
        document.getElementById('login-div').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        loggedIn()
    }
}

function showDoc(type) {
    window.scrollTo(0, 0);
    const docs = {
        "imprint": "Impressum",
        "gdpr": "Datenschutzerklärung",
    }
    document.body.innerHTML += `<div class="doc">${docs[type]}</div>`
}

window.scrollTo(0, 0);
document.getElementById("login").addEventListener("click", logUserIn)
document.getElementById("imprint").addEventListener("click", () => { showDoc("imprint") })
document.getElementById("gdpr").addEventListener("click", () => { showDoc("gdpr") })