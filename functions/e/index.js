// /e/ (the form the app shares: /e/?id=<eventId>). See ../_lib/handleEventPage.js.
import { handleEventPage } from "../_lib/handleEventPage.js";

export const onRequest = handleEventPage;
