import { useOutletContext } from 'react-router-dom';

export default function useBookAIContext() {
  const context = useOutletContext();
  return context || { setAllBooks: () => {} };
}
