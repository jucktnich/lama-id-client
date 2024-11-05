import { supabase, user } from './supabase.js'
import { config } from './helpers.js'
import { paid } from './app.js'

let promiseResolve;

const appEle = document.getElementById("app");
let leftEle;
let invoice = {};

function showPaymentScreen1() {
    window.scrollTo(0, 0);
    appEle.innerHTML = `
    <h1>Bestellung</h1>
    <div class="grid-w-line" id="payment-div">
        <div id="pay-left-ele">
            <h2>Informationen zur Bezahlung des Ausweises</h2>
            <p>Die Abrechnung des Ausweises läuft direkt über Lama-ID und nicht über die ausgebende Schule.<br>Hierfür ist im nächsten Schritt die Angabe von einigen Informationen notwendig.</p>
        </div>
        <div id="pay-right-ele">
            <h2>Produkte</h2>
            <p><b>Schülerausweis</b><br>personalisiert, Auslieferung über Schule</p>
            <p><b>zu zahlen: ${Number(user.campaign.payment_information.price / 100).toFixed(2)}€
        </div>
    </div>
    <button id="next-payment-screen">Weiter</button>`
    leftEle = document.getElementById('pay-left-ele');
    document.getElementById('next-payment-screen').addEventListener('click', showPaymentScreen2)
}

function showPaymentScreen2() {
    if (user.invoice) {
        showPaymentScreen4();
    } else {
        window.scrollTo(0, 0);
        leftEle.innerHTML = `
        <h2>Angaben zum Rechnungsempfänger</h2>
        <form id="invoice-recipient-form">
            <input type="text" id="invoice-name" placeholder="Vor- und Nachname" autocomplete="name" required />
            <input type="text" id="invoice-street" placeholder="Straße" autocomplete="street-address" required />
            <input type="text" id="invoice-number" placeholder="Nr." autocomplete="address-line-2" required />
            <input type="text" id="invoice-zip" inputmode="numeric" placeholder="PLZ" autocomplete="postal-code" required />
            <input type="text" id="invoice-city" placeholder="Ort" autocomplete="address-level-2" required />
            <input type="email" id="invoice-email" placeholder="E-Mail-Adresse" autocomplete="email" required />
            <button id="invoice-submit" type="submit">Weiter</button>
        </form>
        `
        document.getElementById('next-payment-screen').style.display = 'none';
        document.getElementById('invoice-recipient-form').addEventListener('submit', function(event) {
            event.preventDefault();
            invoice.name = document.getElementById('invoice-name').value;
            invoice.street = document.getElementById('invoice-street').value;
            invoice.number = document.getElementById('invoice-number').value;
            invoice.zip = document.getElementById('invoice-zip').value;
            invoice.city = document.getElementById('invoice-city').value;
            invoice.email = document.getElementById('invoice-email').value;
            document.getElementById('next-payment-screen').style.display = 'block';
            showPaymentScreen3();
        });
    }
    //pattern="\d{5}"
    /*document.getElementById('next-payment-screen').addEventListener('click', () => {
        document.getElementById("invoice-recipient-form").submit();
    })*/
}

function showPaymentScreen3() {
    document.getElementById('next-payment-screen').innerHTML = 'Zur Zahlung'
    window.scrollTo(0, 0);
    leftEle.innerHTML = `
    <h2>Zusammenfassung</h2>
    <p><b>Schüler:</b><br>${user.first_name} ${user.last_name}, ${user.group.name}</p>
    <p><b>Rechnungsempfänger:</b><br>${invoice.name}<br>${invoice.street} ${invoice.number}<br>${invoice.zip} ${invoice.city}<br>${invoice.email}</p>
     <div class="lr"><label class="switch"><input type="checkbox" id="payment-consent"><span class="slider round"></span></label><span>Ich habe die AGB gelesen und stimme ihnen zu.</span></div></div>
    `
    document.getElementById('next-payment-screen').disabled = 'true';
    let state = false
    document.getElementById('payment-consent').addEventListener('change', (event) => {
        state = !state
        if (state) document.getElementById('next-payment-screen').removeAttribute('disabled');
        else document.getElementById('next-payment-screen').disabled = 'true';})
    document.getElementById('next-payment-screen').addEventListener('click', async () => {
        await supabase
            .from('invoice_data')
            .insert({
            user_id: user.id,
            campaign_id: user.campaign.id,
            data: invoice
            })
        showPaymentScreen4();
    })
}

function showPaymentScreen4() {
    document.getElementById('next-payment-screen').style.display = 'none';
    window.scrollTo(0, 0);
    leftEle.innerHTML = `
    <button class="select-payment" id="pay-via-sct"><b>Überweisung</b><br>manuell vom Bankkonto</button>
    <button class="select-payment" id="pay-via-mollie"><b>Online-Zahlung</b><br>mit PayPal, Kreditkarte, usw.</button>
    `
    document.getElementById('pay-via-sct').addEventListener('click', payViaSCT)
    document.getElementById('pay-via-mollie').addEventListener('click', payViaMollie)
}

function payViaSCT() {
    document.getElementById('next-payment-screen').innerHTML = 'Zum Upload'
    document.getElementById('next-payment-screen').style.display = 'block';
    window.scrollTo(0, 0);
    leftEle.innerHTML = `
    <h2>Verwendungszweck</h2>
    <p>Schülerausweis ${user.first_name} ${user.last_name} ${user.school_id}${user.public_id}</p>
    <h2>Bankverbindung</h2>
    <p>${user.campaign.payment_information.sct.name}</p>
    <p>${user.campaign.payment_information.sct.iban}</p>
    <p>${user.campaign.payment_information.sct.bic}</p>
    <p>Sobald wir die Überweisung verbucht haben, wird der Ausweis zum Druck freigegeben. Im nächsten Schritt kann hierfür bereits das Foto hochgeladen werden.</p>
    <p>Mit einer Überweisung können auch mehrere Schülerausweise bezahlt werden. Hierfür muss der Verwendungszweck alle IDs mit einem Leerzeichen getrennt enthalten; der Betrag entspricht der Summe aller Beträge für die einzelnen Ausweise.</p>
    `
    document.getElementById('next-payment-screen').addEventListener('click', async () => {
        paid();
    })
}

async function payViaMollie() {
    let paymentReqResponse = await fetch(config.apiURL + 'payment/start/?paymentMethod=mollie', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user: user.id,
            campaign: user.campaign.id
        })
    });
    paymentReqResponse = await paymentReqResponse.json();
    if (paymentReqResponse.action === 'openURL') window.location = paymentReqResponse.url
}

export default function() {
    console.log('Showing payment screens');
    /*return new Promise((resolve, reject), () => {
        promiseResolve = resolve;*/
        showPaymentScreen1();
    //})
}