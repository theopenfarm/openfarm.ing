# .well-known

Files here are served from the site root, verbatim, at
`https://openfarm.ing/.well-known/<name>`.

## Sign in with Apple

Apple verifies the domain before it will accept a return URL. In the developer
portal, under Certificates, Identifiers & Profiles → Identifiers → your
**Services ID** → Sign in with Apple → Configure → Website URLs, adding
`openfarm.ing` offers a file called `apple-developer-domain-association.txt`.

Download it, drop it in this directory, deploy, and press Verify. The file has
to stay here: Apple re-checks it.

Nothing else in this directory is generated - `acme` challenges are served by
the gateway from its own path, not from here.
