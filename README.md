# Drop

Drop is an end-to-end encrypted and anonymous dead-drop. Each browser can be registered as
a unique client. An asymmetric key is then generated, as well as a password, and a unique
alias is issued. You can then give this alias to whomever you want to correspond to through
a channel you trust.

When you want to send a message, the alias is used to retrieve the public key(s) of your 
recipient(s). The message is encoded using a unique AES content encryption key (CEK). A
key encryption key (KEK) is then derived from the public key of your recipient, and your
own private key. This KEK is used to encrypt the CEK. Both the encrypted message and the
encrypted CEK are then sent to the backend.

When retrieving your messages, the server starts with validating your password, then sends
a list of encrypted messages, and their corresponding encrypted content encryption key. The
key encryption key is derived from yet again your own private key and the emitter's public
key, then used to decrypt the encrypted content encryption key, then used to decrypt the
message.

In addition you can send anonymous messages. A unique asymmetric client key will be used to
derive the KEK and encrypt the message, then the private key will be discarded, the public 
key will be attached to the message and sent along. The alias of your client is also not
communicated along. The recipient of the message cannot know who sent it. Another consequence
is that the message is guaranteed to be readable only by the recipient, since the KEK can
only be derived from their private key (the other one being discarded).

Drop also allows to display a drop only once. The server will dispose of the drop as soon as
it is retrieved from it ; making it display only once to the recipient.

It was initially created to safely copy sensitive material between my phone and my computer,
or send a password to my spouse ; but then things went a little crazy.

## Use

Deploy to a server. There's a k8s chart in there if you need it. Drop can be deployed using
either file storage or a sqlite database.

## Encryption

Encryption is the strong point of Drop.

For each message being sent, a new one-time use AES-256 key gets generated using the native browser
cryptographic functions. This key is is called a Content Encryption Key, or CEK. It is used... to
encrypt the content. AES-256 is still considered a strong algorithm, however it is _symmetrical_. 
The cypher it produces can only be decrypted by that exact same key. This means that anyone
who finds that key can decrypt the message. So we need to encrypt that key to send it to the
recipient.

This is done using a Key Encryption Key, or KEK. This Key Encryption Key is produced using
an _asymmetrical_ encryption algorithm. For the purpose of Drop, we are using Elliptic-Curve
Diffie-Hellman, also known as ECDH. Both you and your recipient each have your own pair of
public and private keys. Your private key never leaves your browser. Your public key is sent
to the server and can be retrieved to decrypt a message you sent.

ECDH allows to derive an AES encryption key from the combination of your private key, and your
recipient's public key. A very singular property of ECDH is that this will produce the same 
encryption key than if it was derived from your public key, and the recipient's private key. In
other words, `derive(your_private_key, their_public_key) = derive(your_public_key, their_private_key)`.
So, very conveniently, we can get an AES-256 key using material that you only know, and that your
recipient only knows, which we are then using as a Key Encryption Key, or KEK.

The next step therefore is simply to encrypt the CEK with the KEK, then communicate both the
encrypted message and the encrypted key to the server. When sending to multiple recipient, this
also conveniently allows us to encrypt the message only once, and then encrypt the CEK for each
recipient.

The reception works similarly, in the opposite direction. First, the client retrieves the sender's
public key, then derives the KEK from the sender's public key and the recipient's private key.
The KEK is used to decrypt the Content Encryption Key, then used to decrypt the message.

ECDH is a good asymmetrical encryption algorithm, in that it doesn't have a mathematical solution
yet, and we think the solution is intangible. Breaking it with current hardware architecture is
not practically possible. However, there are concerns with the capacity of quantum computers to
break it. For this reason the NSA is decommissioning it from their list for long term storage 
encryption. For our purpose, targeting drops which are by essence short-lived, this is not a
concern.

For that reason, Drop offers (at least theoretically, unless I botched something) a good layer
of encryption. However it is not immune to non-cryptographic attacks, as detailed below ; and
you should be aware of them before using it.

## Authentication

Authentication of clients you communicate with is done using an alias. The alias is
generated by the server while a client registers itself. The goal is to prevent a bad
actor from trying to register a similar alias to one existing.

A public certificate is hard to communicate, an alias can be given through phone, copied
manually on paper, and so on. This is much handier when you want to ask someone to send
you something. However its main downside is that it is not cryptographic material, it's
only a pointer to the public key. If the dataplane of the server gets compromised, the public key might
get altered, breaking the strength of the cryptographic tunnel. Drop tries to mitigate
that by caching the public key for clients you already communicated with,
which prevents the alteration of the key to have an impact for channels already in
flight. See also 
[resilience](#resilience).

The other flaw of using such an alias is that it needs to be communicated through a channel
that you trust. A bad actor might capture and alter your alias, therefore rendering
the entire communication channel moot.

## Resilience

Drop is a webapp, and as such it has a large dependency on the backend, which is the main
weak point of Drop. Given the encryption scheme, a leak limited at the data level are
is not a concern. The real problem arises if the server becomes controlled by a
malicious actor.

If a malicious actor gains full control to the server, they can serve an altered 
version of the client, which could for example stop validating message senders' keys
and serve false information; or access and transmit the private key, breaking
the entire encryption channel.

The solution is to secure the client. The only preventative measure used by Drop is to
control caching on the browser itself. Drop attempts to signal the browser that the
client itself does not expire, and that it should not be refreshed. That means that
delivering sofwtare updates is harder (people need to manually force-refresh the client),
but it maximizes the resilience we can achieve in browser. Ideally, the private key
could be stored locally in a secured store. Short of that, cache control is, as far
as I know, the only thing we can do about that.

The other obvious point is not to fully trust a deaddrop you don't own, and perform some audits
if what you're sending is mission critical. That includes 1) network, seeing if the
client seems to be sending messages it ought not to, 2) the code itself, in particular
validating that the message is properly encrypted and that there's no more localStorage
access than should be required.

Native, non-web based clients, which are by nature more resilient than a web
interface, are the solution. That is, however, the line that I drew to this project.

## Auditability

## Forensics

Even if the server remains untouched, it still runs on architecture and through
the internet. You leave traces on everything you touch - firewalls, load balancer,
reverse proxies, etc. This leaves a trace that might allow, if not to see the content
of what you send, and least to see that you are using the service, and when.

- Sockets
- Alias
- Files vs. sqlite.

