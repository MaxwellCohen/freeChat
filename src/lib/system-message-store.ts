import { Derived, Store } from '@tanstack/store'

export const systemMessageStore = new Store({
  currentSystemMessage: 'Default Assistant',
  savedSystemMessages: [
    {
      name: 'Default Assistant',
      systemMessage: 'You are a helpful assistant. Return data in markdown format.',
    },
    {
      name: 'Tailwind CSS Assistant',
      systemMessage: 'You are a helpful assistant and Tailwind CSS expert. You will be given css code and you will return the Tailwind CSS classes v4 that match the css code. Return data in markdown format.',
    }
  ],
})

export const currentSystemMessage = new Derived({
  fn: () => systemMessageStore.state.savedSystemMessages.find((message) => message.name === systemMessageStore.state.currentSystemMessage)?.systemMessage || systemMessageStore.state.savedSystemMessages[0].systemMessage,
  deps: [systemMessageStore],
})

const saveToLocalStorage = () => {
  const state = systemMessageStore.state;
  if(globalThis?.localStorage) {
    localStorage.setItem('systemMessages', JSON.stringify(state));
  }
};


// Load from localStorage
const loadFromLocalStorage = () => {
  if(!globalThis?.localStorage) {
    return;
  }
  
  const saved = localStorage.getItem('systemMessages');
  if (saved) {
    systemMessageStore.setState(JSON.parse(saved));
  }
};


// Subscribe to store changes and persist
systemMessageStore.subscribe(() => {
  saveToLocalStorage();
});

// Load on initialization
loadFromLocalStorage();


currentSystemMessage.mount()