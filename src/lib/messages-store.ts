import { Derived, Store } from '@tanstack/store'

type Chat = {
    id: string;
    messages: string;

}


const MessagesStore = new Store({
  messages: [] as Chat[],
})


