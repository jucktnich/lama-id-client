import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://bgedbgapfrskjgvhcptz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWRiZ2FwZnJza2pndmhjcHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMzNTY3OTUsImV4cCI6MjAxODkzMjc5NX0._vFQmXEA6QTBjCmX6b0YF0_mMNG0VGP7LEWDIVS-GXU'
const supabase = createClient(supabaseUrl, supabaseKey)

let userId = null;

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function validate() {
    console.log('validate')
    let input = document.getElementById("file-upload")
    var URL = window.URL || window.webkitURL;
    var file = input.files[0];

    if (file) {
        var image = new Image();

        image.onload = function () {
            if (this.width) {
                console.log('Image has width, I think it is real image');
                document.getElementById('upload-button').removeAttribute("disabled");
            } else {
                document.getElementById('upload-button').disabled = "true"
            }
        };

        image.src = URL.createObjectURL(file);
    }
};

async function uploadPicture() {
    console.log("up")
    let picture = document.getElementById("file-upload").files[0]
    let filetype = picture.type.split('/')[1]
    let id = uuidv4();
    let { data, error } = await supabase
        .storage
        .from('pictures')
        .upload(userId + '/' + id + '.' + filetype, picture, {
            cacheControl: '3600',
            upsert: false
        })
    if (error) alert("Fehler beim Upload")
    await supabase
        .from('picture_list')
        .insert({ picture_id: id, user: userId, filetype: filetype })
}

async function uploadPictureScreen() {
    document.getElementById("upload-picture-div").innerHTML = `<input type="file" id="file-upload"><button id="upload-button" disabled>Bild hochladen</button>`
    document.getElementById("file-upload").addEventListener('change', validate)
    document.getElementById("upload-button").addEventListener('click', uploadPicture)
}

async function loggedIn() {
    const { data, error } = await supabase
        .from('picture_list')
        .select()
        .eq("user", userId)
    console.log(data)
    if (data.length === 0) {
        console.log("No picture uploaded");
        uploadPictureScreen()
    } else {
        const { data, error } = await supabase
            .from('verified_pictures')
            .select()
            .eq("user_id", userId)
        let status = 'unbearbeitet'
        if(data.length !== 0) {
            if (data[0] === 'ACCEPTED') status = 'akzeptiert'
            else if (data[0] === 'DENIED') status = 'abgelehnt'
        }
        document.getElementById("upload-picture-div").innerHTML = `Du hast bereits ein Bild hochgeladen. Status: ` + status
    }
}

async function logUserIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
    })
    if (error) {
        console.warn(error);
        document.getElementById("loginError").style.display = "block"
    } else {
        userId = data.user.id
        document.getElementById("login-div").style.display = "none"
        loggedIn()
    }
}

document.getElementById("login").addEventListener("click", logUserIn)