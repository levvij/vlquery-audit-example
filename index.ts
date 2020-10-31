import { DbClient } from "vlquery";
import { DbContext } from "./db/context";
import { RequestContext, Request } from "./request-context";

import * as express from "express";

// create express app
const app = express();

// create a run context for every request
app.use(async (req: Request, res, next) => {
	const runContext = new RequestContext();

	// create db context with the run context and pass it on to the request handler
	req.db = new DbContext(runContext);

	// lets just pretend that this is how easy auth is :O
	runContext.currentUser = await req.db.person.first(person => person.username == "bob");

	next();
});

app.get("/author/:username", async (req: Request, res) => {
	const author = await req.db.person.first(p => p.username == req.params.username);

	// this is not safe - this is just for the demo
	res.end(`
	
<h1>${author.firstname} ${author.lastname}</h1>
<p>Joined ${author.joinDate} as ${author.username}</p>

<h2>Books</h2>
<ul>
	${(await author.books.toArray()).map(book => `
	
	<li>
		<a href="/book/${book.id}">
			${book.title}
		</a>
	</li>
	
	`).join("")}
</ul>
	
	`)
});

app.get("/book/:id", async (req: Request, res) => {
	const book = await req.db.book.find(req.params.id);
	const author = await book.author.fetch();

	// create new page visit
	book.pageVisits++;
	await req.db.book.update(book, "Visited page");

	// this is not safe - this is just for the demo
	res.end(`
	
<h1>${book.title}</h1>
<p>
	Written by <a href="/author/${author.username}">
		${author.firstname} ${author.lastname}
	</a>
</p>
<p>Published at ${book.publishedAt}, ${book.pageVisits} page visits</p>
	
	`);
});

app.get("*", async (req: Request, res) => {
	const authors = await req.db.person.toArray();

	// this is not safe - this is just for the demo
	res.end(`
	
<h1>Authors</h1>

<ul>
	${authors.map(author => `<li>
		<a href="/author/${author.username}">
			${author.firstname} ${author.lastname}
		</a>
	</li>`).join("")}
</ul>
	
	`);
});

// this has to only be done once
DbClient.connectedClient = new DbClient({
    user: "postgres",
    password: "postgres", 
    database: "test_project"
});

DbClient.connectedClient.connect().then(async () => {
	app.listen(8080, () => {
		console.log(`Server started on :8080!`);
	});
});