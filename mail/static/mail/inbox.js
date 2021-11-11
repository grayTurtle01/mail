document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // Send Email
  document.querySelector('#compose-form').onsubmit = () => {
    let recipients = document.querySelector('#compose-recipients').value
    let subject = document.querySelector('#compose-subject').value
    let body = document.querySelector('#compose-body').value
    
    fetch("/emails", {
      method: 'POST',
      body: JSON.stringify({
        'recipients': recipients,
        'subject': subject,
        'body': body
      })
    })
    .then( res => res.json())
    .then( data => console.log(data))  

    load_mailbox('sent')
    return false
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show mails
  fetch(`/emails/${mailbox}`)
    .then( res => res.json() )
    .then( mails => {
      //console.log(mails)
      mails.forEach( mail => {

        let div = document.createElement('div')
        

        if( mail.read == false )
          div.className = 'mail'
        else
          div.className = 'mail readed'
 
        let left = document.createElement('div')
        left.id = mail.id
        left.onclick = showMail
        let right = document.createElement('div')

        let email 
        
        if( mailbox == 'inbox'){
          email = mail.sender
          archive_button = document.createElement('button')
          archive_button.className = "archive"
          archive_button.innerText = "Archive"
          archive_button.id = mail.id
          archive_button.onclick = archive_mail
        }
        else if (mailbox == 'sent')
          email = mail.recipients[0]

        else if( mailbox == 'archive'){
          email = mail.sender
          archive_button = document.createElement('button')
          archive_button.className = "archive"
          archive_button.innerText = "UnArchive"
          archive_button.id = mail.id
          archive_button.onclick = un_archive_mail
        }

        left.innerHTML = `<div><strong class="mr-3">${email} </strong> ${mail.subject} </div>`
        right.innerHTML = `<div><span class='text-secondary'>${mail.timestamp}</span></div> `

        if(mailbox == 'inbox' || mailbox == 'archive'){
          right.append(archive_button)
        }

        div.append(left)
        div.append(right)  

        document.querySelector('#emails-view').append(div)
      })
    })
    .catch( error => console.log(error))


}

function showMail(){
  fetch(`/emails/${this.id}`)
    .then( res => res.json())
    .then( mail => {
      //console.log(mail)

      document.querySelector('#emails-view').style.display = 'none'
      document.querySelector('#email-view').style.display = 'block'

      document.querySelector('#email-view').innerHTML = `
        <h3 class="mb-3">View Email</h3>
        ${mail.sender }  ==>  ${mail.recipients[0]}
        <h5 class="mt-5">${mail.subject}</h5>
        <p>${mail.body}</p>
      `
      fetch(`/emails/${this.id}`, {
        method : 'PUT',
        body : JSON.stringify({
          read: true
        })
      })
        // .then( res => res.json() )
        // .then( data => console.log(data))
        // .catch( err => console.log(err))
    })
    .catch(err => console.log(err))
}

function archive_mail(){
  fetch(`/emails/${this.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  // .then( res => res.text())
  // .then( data => console.log(data))
  //load_mailbox('inbox')
}

function un_archive_mail(){
  fetch(`/emails/${this.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  // .then( res => res.json())
  // .then( data => console.log(data))
  //load_mailbox('inbox')

}