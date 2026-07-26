/*
 * Submits the field-visit form to the API without leaving the page.
 *
 * The form works without this file: it is a real <form> with a real action and
 * method, so if the script fails to load the browser posts it normally and the
 * API's redirect response takes over. This only upgrades that into an inline
 * result, which matters on a phone in a farmyard on a bad connection where a
 * full navigation is the part that fails.
 */
;(function () {
  function init() {
    var form = document.getElementById('demo-form')
    if (!form || form.dataset.bound === '1') return
    form.dataset.bound = '1'

    var submit = document.getElementById('demo-submit')
    var error = document.getElementById('demo-error')
    var success = document.getElementById('demo-success')

    function showError(message) {
      error.textContent = message
      error.classList.remove('hidden')
      submit.disabled = false
      submit.textContent = 'Book a field visit'
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault()
      error.classList.add('hidden')

      var data = Object.fromEntries(new FormData(form).entries())
      if (!data.name || !data.email) {
        showError('A name and an email address are the two things we cannot do without.')
        return
      }

      submit.disabled = true
      submit.textContent = 'Sending...'

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (response) {
          return response.json().then(function (body) {
            return { ok: response.ok, body: body }
          })
        })
        .then(function (result) {
          if (!result.ok) {
            showError(result.body && result.body.message ? result.body.message : 'That did not go through. Try again, or email hello@openfarm.ing.')
            return
          }
          form.classList.add('hidden')
          success.classList.remove('hidden')
        })
        .catch(function () {
          showError('That did not go through. Try again, or email hello@openfarm.ing.')
        })
    })
  }

  // Runs on first load and again after an stx client-side navigation, which
  // does not re-execute page scripts.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
  document.addEventListener('stx:load', init)
})()
