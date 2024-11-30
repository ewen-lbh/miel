import{t as I}from"./index.CmFOe5Tk.js";import{P as w,Q as R,R as D,S as C}from"./scheduler.5XQODGQl.js";import{w as O}from"./entry.BX_A1ukV.js";function j(e){return(e==null?void 0:e.length)!==void 0?e:Array.from(e)}function $(e,t){e.d(1),t.delete(e.key)}function U(e,t,n,a,r,d,i,l,s,g,h,B){let m=e.length,c=d.length,y=m;const x={};for(;y--;)x[e[y].key]=y;const b=[],E=new Map,T=new Map,M=[];for(y=c;y--;){const o=B(r,d,y),p=n(o);let u=i.get(p);u?M.push(()=>u.p(o,t)):(u=g(p,o),u.c()),E.set(p,b[y]=u),p in x&&T.set(p,Math.abs(y-x[p]))}const S=new Set,N=new Set;function A(o){I(o,1),o.m(l,h),i.set(o.key,o),h=o.first,c--}for(;m&&c;){const o=b[c-1],p=e[m-1],u=o.key,f=p.key;o===p?(h=o.first,m--,c--):E.has(f)?!i.has(u)||S.has(u)?A(o):N.has(f)?m--:T.get(u)>T.get(f)?(N.add(u),A(o)):(S.add(f),m--):(s(p,i),m--)}for(;m--;){const o=e[m];E.has(o.key)||s(o,i)}for(;c;)A(b[c-1]);return w(M),b}function F(e,t){const n={},a={},r={$$scope:1};let d=e.length;for(;d--;){const i=e[d],l=t[d];if(l){for(const s in i)s in l||(a[s]=1);for(const s in l)r[s]||(n[s]=l[s],r[s]=1);e[d]=l}else for(const s in i)r[s]=1}for(const i in a)i in n||(n[i]=void 0);return n}function q(e){return typeof e=="object"&&e!==null?e:{}}var G=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function Q(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}function X(e){if(e.__esModule)return e;var t=e.default;if(typeof t=="function"){var n=function a(){return this instanceof a?Reflect.construct(t,arguments,this.constructor):t.apply(this,arguments)};n.prototype=t.prototype}else n={};return Object.defineProperty(n,"__esModule",{value:!0}),Object.keys(e).forEach(function(a){var r=Object.getOwnPropertyDescriptor(e,a);Object.defineProperty(n,a,r.get?r:{enumerable:!0,get:function(){return e[a]}})}),n}function L(e){return e<.5?4*e*e*e:.5*Math.pow(2*e-2,3)+1}function Z(e,{delay:t=0,duration:n=400,easing:a=L,amount:r=5,opacity:d=0}={}){const i=getComputedStyle(e),l=+i.opacity,s=i.filter==="none"?"":i.filter,g=l*(1-d),[h,B]=R(r);return{delay:t,duration:n,easing:a,css:(m,c)=>`opacity: ${l-g*c}; filter: ${s} blur(${c*h}${B});`}}function J(e,{delay:t=0,duration:n=400,easing:a=D}={}){const r=+getComputedStyle(e).opacity;return{delay:t,duration:n,easing:a,css:d=>`opacity: ${d*r}`}}const P={modules:[{name:"emails",metadata:{},displayName:"emails",rawDocs:`# emails

The email messages themselves
`,shortDescription:"The email messages themselves",renderedDocs:`<html><head></head><body>
<p>The email messages themselves</p></body></html>`,types:["Email","EmailConnection","Header","Label"],queries:[],mutations:[],subscriptions:[],items:[{name:"Email",id:"Email",type:"type",referencedBy:["EmailConnection","EmailEdge","Header"],implementedBy:[],returnedBy:["email"],deprecationReason:null,moduleName:"emails",match:{static:{matcher:"Email"}}},{name:"EmailConnection",id:"EmailConnection",type:"type",referencedBy:["Address","Label","Mailbox"],implementedBy:[],returnedBy:[],deprecationReason:null,connection:{nodeType:"Email",edgeType:"EmailEdge",connectionType:"EmailConnection"},moduleName:"emails",match:{static:{matcher:"EmailConnection"}}},{name:"Header",id:"Header",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"emails",match:{static:{matcher:"Header"}}},{name:"Label",id:"Label",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"emails",match:{static:{matcher:"Label"}}}]},{name:"accounts",metadata:{},displayName:"accounts",rawDocs:`# accounts

TODO: docs
`,shortDescription:"TODO: docs",renderedDocs:`<html><head></head><body>
<p>TODO: docs</p></body></html>`,types:["Account","Server","ServerType"],queries:[],mutations:[],subscriptions:[],items:[{name:"Account",id:"Account",type:"type",referencedBy:["Mailbox","Server"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"accounts",match:{static:{matcher:"Account*"}}},{name:"Server",id:"Server",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"accounts",match:{static:{matcher:"Server*"}}},{name:"ServerType",id:"ServerType",type:"type",referencedBy:["Server"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"accounts",match:{static:{matcher:"Server*"}}}]},{name:"mailboxes",metadata:{},displayName:"mailboxes",rawDocs:`# mailboxes

TODO: docs
`,shortDescription:"TODO: docs",renderedDocs:`<html><head></head><body>
<p>TODO: docs</p></body></html>`,types:["Mailbox","MailboxConnection","MailboxEdge","MailboxType"],queries:[],mutations:[],subscriptions:[],items:[{name:"Mailbox",id:"Mailbox",type:"type",referencedBy:["Email"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}},{name:"MailboxConnection",id:"MailboxConnection",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,connection:{nodeType:"MailboxType",edgeType:"MailboxEdge",connectionType:"MailboxConnection"},moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}},{name:"MailboxEdge",id:"MailboxEdge",type:"type",referencedBy:["MailboxConnection"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}},{name:"MailboxType",id:"MailboxType",type:"type",referencedBy:["Mailbox","MailboxConnection","MailboxEdge"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}}]},{name:"addresses",metadata:{},displayName:"addresses",rawDocs:`# addresses

TODO: docs
`,shortDescription:"TODO: docs",renderedDocs:`<html><head></head><body>
<p>TODO: docs</p></body></html>`,types:["Address","AddressType","EmailAddress"],queries:[],mutations:[],subscriptions:[],items:[{name:"Address",id:"Address",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"addresses",match:{static:{matcher:"Address*"}}},{name:"AddressType",id:"AddressType",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"addresses",match:{static:{matcher:"Address*"}}},{name:"EmailAddress",id:"EmailAddress",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"addresses",match:{static:{matcher:"EmailAddress"}}}]},{name:"global",metadata:{},displayName:"global",rawDocs:`# global

TODO: docs
`,shortDescription:"TODO: docs",renderedDocs:`<html><head></head><body>
<p>TODO: docs</p></body></html>`,types:["ID","Node","PageInfo"],queries:[],mutations:[],subscriptions:[],items:[{name:"ID",id:"ID",type:"type",referencedBy:["Account","Address","Email","Header","Label","Mailbox","Node","Server"],implementedBy:[],returnedBy:[],moduleName:"global",match:{static:{matcher:"ID"}}},{name:"Node",id:"Node",type:"type",referencedBy:[],implementedBy:["Account","Address","Email","Header","Label","Mailbox","Server"],returnedBy:["node","nodes"],deprecationReason:null,moduleName:"global",match:{static:{matcher:"Node"}}},{name:"PageInfo",id:"PageInfo",type:"type",referencedBy:["EmailConnection","MailboxConnection"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"global",match:{static:{matcher:"PageInfo"}}}]}],schema:`directive @graphinx(module: String) on OBJECT | FIELD_DEFINITION | SCALAR | ENUM | UNION | INTERFACE | INPUT_OBJECT

"""
Represents a user account with associated mailboxes and server configurations.
"""
type Account implements Node {
  """The email address of the account."""
  address: String
  id: ID!

  """The display name of the account holder."""
  name: String
}

"""Represents an email address with optional metadata."""
type Address implements Node {
  """The email address."""
  address: String

  """Optional URL of the avatar associated with the address."""
  avatarURL: URL

  """Emails where this address is in the CC field."""
  ccEmails(after: String, before: String, first: Int, last: Int): EmailConnection
  id: ID!

  """Indicates whether the address is known (for recipients)."""
  known: Boolean

  """The name associated with the email address."""
  name: String

  """Emails received by this address."""
  receivedEmails(after: String, before: String, first: Int, last: Int): EmailConnection

  """Emails sent by this address."""
  sentEmails(after: String, before: String, first: Int, last: Int): EmailConnection

  """Indicates whether the address is verified (for senders)."""
  verified: Boolean
}

enum AddressType {
  RECIPIENT
  SENDER
}

"""
A field whose value is a hex color code: https://en.wikipedia.org/wiki/Web_colors.
"""
scalar Color

"""Represents an email message."""
type Email implements Node {
  """The HTML body content of the email."""
  html: HTML
  id: ID!

  """The mailbox that contains the email."""
  inbox: Mailbox

  """The raw, entire body of the email (all parts)."""
  raw: String

  """The subject of the email."""
  subject: String

  """The text body content of the email."""
  text: String

  """Indicates whether the email is trusted (not spam)."""
  trusted: Boolean
}

"""
A field whose value conforms to the standard internet email address format as specified in HTML Spec: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address.
"""
scalar EmailAddress

type EmailConnection {
  edges: [EmailEdge!]!
  nodes: [Email!]!
  pageInfo: PageInfo!
}

type EmailEdge {
  cursor: String!
  node: Email!
}

scalar HTML

"""Represents a key-value header in an email."""
type Header implements Node {
  """The email that contains this header."""
  email: Email
  id: ID!

  """The header key (e.g., "Subject", "Date")."""
  key: String

  """The header value."""
  value: String
}

"""Represents a label applied to an email."""
type Label implements Node {
  """Color code for the label."""
  color: Color

  """Emails with this label."""
  emails(after: String, before: String, first: Int, last: Int): EmailConnection
  id: ID!

  """Key for the label (not displayed)."""
  key: String

  """Display text for the label."""
  text: String
}

"""Represents a mailbox, such as an inbox, trash, or sent folder."""
type Mailbox implements Node {
  """The account this mailbox belongs to."""
  account: Account

  """List of emails stored in this mailbox."""
  emails(after: String, before: String, first: Int, last: Int): EmailConnection
  id: ID!

  """Indicates whether this is the main mailbox."""
  main: Boolean

  """Optional name for the mailbox."""
  name: String

  """The type of mailbox (e.g., Inbox, Trashbox, Sentbox)."""
  type: MailboxType

  """Accounts that use this mailbox as the drafts mailbox."""
  usedAsDraftsboxOn: [Account!]

  """Accounts that use this mailbox as the main mailbox."""
  usedAsMainboxOn: [Account!]

  """Accounts that use this mailbox as the sent mailbox."""
  usedAsSentboxOn: [Account!]

  """Accounts that use this mailbox as the trash mailbox."""
  usedAsTrashboxOn: [Account!]
}

type MailboxConnection {
  edges: [MailboxEdge!]!
  nodes: [MailboxType!]!
  pageInfo: PageInfo!
}

type MailboxEdge {
  cursor: String!
  node: MailboxType!
}

enum MailboxType {
  DRAFTS
  INBOX
  SENTBOX
  TRASHBOX
}

type Mutation

interface Node {
  id: ID!
}

type PageInfo {
  endCursor: String
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
}

type Query {
  """Find a mail by id"""
  email(id: ID!): Email
  node(id: ID!): Node
  nodes(ids: [ID!]!): [Node]!
}

"""Represents an email server used for sending or receiving emails."""
type Server implements Node {
  """Hostname of the server."""
  host: String
  id: ID!

  """Password for authentication (optional for OAuth2)."""
  password: String

  """Port number for the server."""
  port: Int

  """Accounts that use this server for receiving emails."""
  receiverAccounts: [Account!]

  """Indicates whether the connection to the server is secure."""
  secure: Boolean

  """Accounts that use this server for sending emails."""
  senderAccounts: [Account!]

  """OAuth2 token for authentication (optional for password-based auth)."""
  token: String

  """The type of server (SMTP, IMAP, etc.)."""
  type: ServerType

  """The username used to authenticate with the server."""
  username: String
}

enum ServerType {
  Google
  IMAP
  SMTP
}

type Subscription

"""
Une adresse internet (URL). Les protocoles autorisés sont: http:, https:, mailto:, tel:
"""
scalar URL`,config:{template:"graphinx/templates/default#v0.12.2",schema:{static:"../fructose/schema.gql"},branding:{name:"Miel API",logo:{dark:"https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png",light:"https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png"}},types:{relay:{connection:"^[A-Z]\\w+Connection$",nodes:"edges.node",edges:"edges"},errors:{result:"^[A-Z]\\w+Result$",success:"^[A-Z]\\w+Success$",datafield:"data"},input:{type:"Mutation[FieldName]Input"}},description:`@miel/invertase
===============

GraphQL server implemented in Pothos that exposes data from the database (defined at @miel/ruche).

Also provides subscriptions to listen to real-time updates from @miel/nectar's Redis pub/sub server.
`,modules:{docs:"docs/[module].md",icons:"docs/[module].svg",order:["emails","accounts","mailboxes","addresses","global"],fallback:"global",filesystem:[],mapping:{ID:"global",Node:"global",PageInfo:"global",Error:"global",ErrorInterface:"global","*Error":"global","Mailbox*":"mailboxes","Address*":"addresses",EmailAddress:"addresses","Account*":"accounts","Server*":"accounts",Email:"emails",EmailConnection:"emails",Header:"emails",Label:"emails"}},environment:{},_dir:"."},items:[{name:"Email",id:"Email",type:"type",referencedBy:["EmailConnection","EmailEdge","Header"],implementedBy:[],returnedBy:["email"],deprecationReason:null,moduleName:"emails",match:{static:{matcher:"Email"}}},{name:"EmailConnection",id:"EmailConnection",type:"type",referencedBy:["Address","Label","Mailbox"],implementedBy:[],returnedBy:[],deprecationReason:null,connection:{nodeType:"Email",edgeType:"EmailEdge",connectionType:"EmailConnection"},moduleName:"emails",match:{static:{matcher:"EmailConnection"}}},{name:"Header",id:"Header",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"emails",match:{static:{matcher:"Header"}}},{name:"Label",id:"Label",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"emails",match:{static:{matcher:"Label"}}},{name:"Account",id:"Account",type:"type",referencedBy:["Mailbox","Server"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"accounts",match:{static:{matcher:"Account*"}}},{name:"Server",id:"Server",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"accounts",match:{static:{matcher:"Server*"}}},{name:"ServerType",id:"ServerType",type:"type",referencedBy:["Server"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"accounts",match:{static:{matcher:"Server*"}}},{name:"Mailbox",id:"Mailbox",type:"type",referencedBy:["Email"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}},{name:"MailboxConnection",id:"MailboxConnection",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,connection:{nodeType:"MailboxType",edgeType:"MailboxEdge",connectionType:"MailboxConnection"},moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}},{name:"MailboxEdge",id:"MailboxEdge",type:"type",referencedBy:["MailboxConnection"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}},{name:"MailboxType",id:"MailboxType",type:"type",referencedBy:["Mailbox","MailboxConnection","MailboxEdge"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"mailboxes",match:{static:{matcher:"Mailbox*"}}},{name:"Address",id:"Address",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"addresses",match:{static:{matcher:"Address*"}}},{name:"AddressType",id:"AddressType",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"addresses",match:{static:{matcher:"Address*"}}},{name:"EmailAddress",id:"EmailAddress",type:"type",referencedBy:[],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"addresses",match:{static:{matcher:"EmailAddress"}}},{name:"ID",id:"ID",type:"type",referencedBy:["Account","Address","Email","Header","Label","Mailbox","Node","Server"],implementedBy:[],returnedBy:[],moduleName:"global",match:{static:{matcher:"ID"}}},{name:"Node",id:"Node",type:"type",referencedBy:[],implementedBy:["Account","Address","Email","Header","Label","Mailbox","Server"],returnedBy:["node","nodes"],deprecationReason:null,moduleName:"global",match:{static:{matcher:"Node"}}},{name:"PageInfo",id:"PageInfo",type:"type",referencedBy:["EmailConnection","MailboxConnection"],implementedBy:[],returnedBy:[],deprecationReason:null,moduleName:"global",match:{static:{matcher:"PageInfo"}}}]},v=O([]);function W(){const e=[...document.styleSheets].find(n=>{var a;return(a=n.href)==null?void 0:a.endsWith("colors.css")}),t=[...(e==null?void 0:e.cssRules)??[]].find(n=>n instanceof CSSStyleRule&&n.selectorText===":root");v.set([...t.style].map(n=>n.replace(/^--/,"")))}function K(e){var t,n;return((n=(t=P.modules.find(a=>a.name===e))==null?void 0:t.metadata)==null?void 0:n.color)||C(v)[0]}export{q as a,Q as b,G as c,P as d,j as e,Z as f,F as g,X as h,$ as i,J as j,W as l,K as m,U as u};
