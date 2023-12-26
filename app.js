import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://bgedbgapfrskjgvhcptz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWRiZ2FwZnJza2pndmhjcHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMzNTY3OTUsImV4cCI6MjAxODkzMjc5NX0._vFQmXEA6QTBjCmX6b0YF0_mMNG0VGP7LEWDIVS-GXU'
const supabase = createClient(supabaseUrl, supabaseKey)

const appEle = document.getElementById("app")

let userId = null;

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
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
                document.getElementById('upload-button').removeAttribute('disabled');
            } else {
                console.warn('First uploaded file is NOT an image');
                document.getElementById('upload-button').disabled = 'true';
            }
        };

        image.src = URL.createObjectURL(file);
    }
};

function uploadSuccessfulScreen() {
    appEle.innerHTML = `Upload erfolgreich`
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
    appEle.innerHTML = `<div><h1>Foto-Upload</h1>
    <div class="grid-w-line"><label id="photo-upload" class="photo-upload">
    <div class="center-content"><img style="width: 4.5em" src="icons/add-a-photo.svg"></div>
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
    document.getElementById("file-upload").addEventListener('change', validate)
    document.getElementById("upload-button").addEventListener('click', uploadPicture)
}

async function statusScreen() {
    const { data, error } = await supabase
        .from('verified_pictures')
        .select()
        .eq('user_id', userId)
    if (error) {
        console.warn(error);
        appEle.innerHTML = '<span class="error">Fehler beim Laden der Daten. Wenn dieser Fehler häufiger auftritt, kontaktiere bitte den Support.</span>'
        return;
    }
    let status = 'unbearbeitet'
    if (data.length !== 0) {
        if (data[0].status === 'ACCEPTED') status = 'akzeptiert'
        else if (data[0].status === 'REJECTED') status = 'abgelehnt'
    }
    appEle.innerHTML = 'Du hast bereits ein Bild hochgeladen. Status: ' + status;
    if (data[0].status === 'REJECTED') appEle.innerHTML += '<button onclick="uploadPictureScreen()">Neues Bild hochladen</button>'
}

async function loggedIn() {
    const { data, error } = await supabase
        .from('picture_list')
        .select()
        .eq("user", userId)
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
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
    });
    if (error) {
        console.warn(error);
        document.getElementById('login-error').style.display = 'grid';
    } else {
        console.log('Successful login')
        userId = data.user.id;
        document.getElementById('login-div').style.display = 'none';
        loggedIn()
    }
}

document.getElementById("login").addEventListener("click", logUserIn)