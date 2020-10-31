import { RunContext } from "vlquery";
import { Person, DbContext } from "./db/context";

// context for every request
export class RequestContext extends RunContext {
	currentUser: Person;
}

// express request with db
export class Request {
	params: any;
	db: DbContext;
}