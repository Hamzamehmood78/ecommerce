import { createContext, useContext, useEffect, useState, Fragment } from "react";
import api from "../api/axios";
import { CURRENCIES, getCurrencyCode, setCurrency } from "../utils/currency";

const CurrencyContext = createContext({ code: "PKR", applyCurrency: () => {} });

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(getCurrencyCode());

  // Currency badle to poori app dobara banti hai (taake har qeemat naye tareeqe se dikhe)
  const applyCurrency = (next) => {
    if (CURRENCIES[next] && next !== getCurrencyCode()) {
      setCurrency(next);
      setCode(next);
    }
  };

  // Server ki asal currency (browser ki yaad rakhi hui se alag ho to theek kar deta hai)
  useEffect(() => {
    api
      .get("/settings")
      .then(({ data }) => applyCurrency(data.currency?.code))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CurrencyContext.Provider value={{ code, applyCurrency }}>
      <Fragment key={code}>{children}</Fragment>
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);