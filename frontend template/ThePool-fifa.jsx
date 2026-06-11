import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Crown, Lock, Minus, Plus, Trophy, Calendar, Users, Target, Swords,
  ListOrdered, TrendingUp, BookOpen, ChevronRight,
} from "lucide-react";

/* ================================================================== *
 * FIFA 21 / 22 design tokens
 * indigo-navy base · electric cyan labels · violet selection ·
 * magenta neon · acid-lime pop · orange-red accent bar
 * ================================================================== */
const C = {
  bg:"#0A0C26", bg2:"#11143A", tile:"#161A47", line:"#34388C", lineSoft:"#262A66",
  cyan:"#22E0DE", cyanDim:"#179FA1", violet:"#8B5CF6", violet2:"#6D3BE8",
  magenta:"#EC2C8E", lime:"#C9F213", orange:"#FF5A2C", gold:"#E8B84B",
  text:"#EAEBFA", mut:"#9DA0D8", mut2:"#6E72B0",
};
const fDisp = "'Rajdhani', sans-serif";
const fBody = "'Inter', sans-serif";
const up = { fontFamily:fDisp, textTransform:"uppercase", letterSpacing:"0.06em" };

const PEOPLE = [
  { id:"you",  name:"You",  short:"YOU", color:"#F4C12A" },
  { id:"maya", name:"Maya", short:"MA",  color:"#22E0DE" },
  { id:"leo",  name:"Leo",  short:"LE",  color:"#EC2C8E" },
  { id:"sam",  name:"Sam",  short:"SA",  color:"#A78BFA" },
];
const RESULT = { 5:C.lime, 3:C.cyan, 0:C.mut2 };

/* ------------------------------------------------------------------ *
 * Deterministic mock data (sample teams — not the official 2026 draw)
 * ------------------------------------------------------------------ */
const FLAGS={"mx":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAb1BMVEXOESbHxqN5TC17XUje1cX8+PHQz7D///8AaEfw7OT8/PlanZ5lOyOZdFujp3bLr5KWZj3M0MHRrm26jmGa1Neprn9rTTt+p6Xh2dXt5dScg3bg5uLcw5jEoICMvb6vo5rl05615OihrarHwb3jxJ6jr2PUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAjklEQVQ4y+3TuRLDIAwEUAOCRICNzek75/9/Y3oquUjH9m80s7Pq7lVuVbo6DTRwDSxuvgA07sdoe00G+PRhtLanAimVC5lzDtQLwNyYe85XGlAIuxdCTOuDkQCThX0PkcVnpgGYTlNMSm9gQAJaLa9YzGk2JYktDRh9iDggtSWp0gSD0lemgVt7oAb+DH5fyySkHmVnWQAAAABJRU5ErkJggg==","kr":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAolBMVEX///87OzyUlJTIyMgKCgsAAAEPDxAAR6DNLjr9/f1EREVMTE2cnJylpaWMjIxTU1TY2NiwsLDwyMzv7+8OUabd3d2fn5+9vMB/fofb29vp6ekTExR5N2PRUV0oXqnRPkkZRJTa5PG6METj4+PU1NRvb3HPNkHbZW5ijsXihIs7crb54+XA0ec1R4y2yuRPPXgoKCmlM06xQVigNFC3e5FXTGwjp0oxAAAACXBIWXMAAAsTAAALEwEAmpwYAAABcklEQVQ4y81UyZaCMBAEBJJAHAQRlFFkERURne3/v200ECQL8rxZx14rnepWlDcGcp+4kMT6YYSRPD5yDU20znRHM2ey8jsT2/pKMKufE90KrDnvmFtTy5yYFhIIEbuKZJVMyw1DnpCtGbLOrcstWFdTJqBv88rNfr8pvbb510xozhCqDrDFoSLVJur9ecykVsuOEPL2sMPWowM08HLBMMVOW8KDfWyrloCNhcfZDaEfJgEemic6sg8iXxBCDoRUhAZls+QTyhEJxl3kugbJNYObkQTwS+PBHUm2HUtIsl48APVYQgySdQa/r4BijNIRcPgbXisy1gufQMY6lyU4zced2Ph66OMCKo3U78f7aSsNZ8qE5w/xKedehn/uiS8fknfasTqlD3ljRt5IvYVr3XG4HGPfj49nukARFrZ6odu7AjtDK1rkBe969QjQrVaFiUeq/MyQzvoOyQ6ZfhvgQnYq3VyugVx6KhU0HVyrJ653wD/R5B2UAXsUDQAAAABJRU5ErkJggg==","za":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAh1BMVEVtsZUdh1y/3dBtTwr7+voHekUJfEv7txTgoxH58vQZEgP9//1TpYO+qCHzsaw8Raa6vd9MizgyhTzutBikoSbf7ugJfE3mXlTnZFoGEo2Gvqjn8u4KFo9gkDMiGAQDD4prsJR9Wgx3VgsAAAHqrhUJFI4Re0T///8AeEfhOS0AAAEADIr/uRW75qajAAAAJ3RSTlPG58HG5tzs88nd6vDO1eTXwb7D8cvI9+j8+cLL9cDl/Me/yf7e9tSFCeEBAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5klEQVQ4y6WV2RLCIAxFo1ar1qXu+z4jFfj/77NQnWIJS8b7fu4pkEmh0Fm3GWOTV0Sg+GSUMJZsCUCspAYqySAkga5B9CIkkJ4KkgSkHJMk0JcynZmSa1ZKNm6Ad9KGpLXySYDzoSUBj6QEOEmiAYqkAirJsmdKDgzNF9CSxdyU7DMvgEkASw0gEiQmwB+3piQAcH4OSv4E7rRPoh6aeK3Uh7PnzzsajuGbCjue8c4vAgcI9Rpw1O+EA7Dq9aZx1CsAWzPOegUgi8xdr4AnpV4BpPofQK/7/ChiAf1DCdXXQGS9EOINegz4vNByNdAAAAAASUVORK5CYII=","cz":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAIVBMVEURRX7XFBr///8iQXaVJDvn7PJYfKQhUYfGGCJTNV2gtcstibC/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAlUlEQVQ4y5WNWRbCMAwDZaC0cP8D9wXSJYnlyPrWzOC9PFID1m8SAFKRAqQi+E+PVECP4JwYuQAxgvuUSAMoEXSbRnpgGsG4OOIAcQTugogPBBGwsQgFWIQDz5d5o//PZhmA6CnA9ATgeh8I9B4Q6h0g1g/ATN8DU30LCPoGUPQ3QNNfgKg/AFlfAV3/AzL6AqT0ZrYDXfEI5viwCtIAAAAASUVORK5CYII=","ca":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAM1BMVEXxu7fZPTHxtrHia2L////dU0j98/PxubXxurbVKx7to5775uX//PvqkYv1ysflfHT319QRULU3AAAACXRSTlPQ////////zc0Got8cAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAsElEQVQ4y+2U2w7DIAiGCwgbHvv+T7vOJqvrsoppelcuTCB8+iPipJtN7o892qQbOAFgHAMEcABYNk/K0YkVEEZQTeTNkmD1ZzNAqx8NwCIb01LB29jlUiNHAAKBeqxumUGJqXPCmlpXqqX4Tg2sO8s9SXugyCEw/wA9SeFbE+RuH4SaCAdD42LZ8sXU6fwJJNvTwIQ5UMjo/cAA8eAAOZZRIFwNtIrc8/4qrwDaa30BIVwuGR2PVTgAAAAASUVORK5CYII=","ch":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAElBMVEX/AAD/////YGD/QED/GBj/nJxHvTznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAPklEQVQ4y2NgGAVkAhZmMGAhWgMTIxgwjWqgigYWJghghWhghXJxxwczI1bAPKqBomAdTa001UByMTMK0AAARd4B0S8+Wh8AAAAASUVORK5CYII=","qa":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAIVBMVEWNGz3///+OHT+lS2Xw4eXHjp/o0djRpLGzZ36TKEj9+/w997KRAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAL0lEQVQ4y2NgRAIs7BycDIQAIyrgYmNlZqKdBpKdNOqHUT+M+mHUD6N+GPUDFAAA6DQFs0a9aAsAAAAASUVORK5CYII=","ba":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAARVBMVEUAAJkUFKFzc8fPz+yBgc0tLatiYsD/zADmuA/9/f/t7fiSdUGfn9mVd0BJSbamptyIbEeGakmOjtK8vOWEakqDaUqKbkakeYFsAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA50lEQVQ4y43U2w6DIBBF0RGBdkQUbP3/Xy1gOmAvcojGF1cAd4SIJh4pj/3WHff83jIPq6HFIKKAodyzTo8nBPLYJuZJ94UA0syK+nNUMD/GNEHaRwSBLVf+WhEDaRi1sbLmUpwAKWbW13OcgRSMIKgFIwaOgmteVcCW1BQMKMgFLf2d4weQggEEtWDAQC5odSkYUCAFHQqkoANBLegw0BR02JLeBdWnuABS0KFACjoQ1IIOA01Bh4Lvgj0gBT0IlvVd0GOgOUU9tqTmH/QokFPUo0AKehDUgh4DpeBxinoU5H2UjexELxydGJSN05abAAAAAElFTkSuQmCC","br":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAolBMVEUrSaPo4A47pz7i2RRJqzowo0Hv4Q/45QkinkUmoENPaK8+WaqUxCVacrU2UqdJY6+q1rG+0hmDvirS2RPz5ArJ1hYxTp6Gj15stjBktDOmySCtrEJ8kMGd0KKxzhx3uy1XsDXRyCacoE641LVyjbZvfXC3tDlYa4GYnFIvTKQ9V5W/ujOFncCyw9WSq8XY5eNofrmfwb16iZ5UaIXKxUrN0cG+4jGPAAAACXBIWXMAAAsTAAALEwEAmpwYAAABkElEQVQ4y81V2ZaCMAwNsg1goW6gIqLAuO8z8/+/Nl0QWy2KTzP3idPmJmlyE+DjTcCfEdLhW4RWx7Y7reaE1LIJrG5DgjGwSwyMBgSn27cr9NvOK4LRo4Z6vIqyBU2sZzwlOG3qfv4JDGGk0yBmPWHG3K+gQrig4WY1BLPN8o5AREyPxqaKMNKZfSzZQzinh9rogWCOeV2sopickHdjLPn51JQJQ60sZI4xTnBy3BcecNqWX2ipQGhNq8pfUOCiYrc/5sl5wgjR9YprBUT3BDApU0GHBJ9d8vFV3TGtABNaBV14b7DD+WENG+GaaAXK3koE5HKKf8B58EAg6rGElIgZM+apuTi5yMqCq/xLLNelJfAo/v5H1u59WVc74Ka8ph7yvoUXC427VtbagOetiemJBwiWYk3rpMEf7fl+EPhzsWsvxIdIcrGkC7W8sxB4rQJwt7LyagcovA2QpG3ViLINoC2yKNtaD9OjXgJCG+/dq9fMrY09o+Ei421U7JjaVUnnT+X+yTIedZ3/9n+oxS/6JjxQK/AwVgAAAABJRU5ErkJggg==","ma":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAGFBMVEXBJy0jVzKgMS5qQS8MXjKtLS4zUjFBTjFR5anzAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAUElEQVQ4y+2RsRUAMQhCg6Lsv3HuNpAinb+wkifIOcvylghTkGkKAG+/gJrbbwDkN3oYpFqIgHp+JBlBJ3aKlCNoSGjjR7+dZJk122Uvy1sure0Ayze9RPgAAAAASUVORK5CYII=","gb-sct":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAG1BMVEUAZb3///+RvePw9vsgeMZQltJXmtTN4fLH3fHIbSiZAAAACXBIWXMAAAsTAAALEwEAmpwYAAAApklEQVQ4y52V2RaAIAhExaX6/y/uZGahLE48dRLwijAGuixtwbWSqmug26LnH5vjE0B7ttzzQWMApeLi1IDYP3Us7vOJlrFenFac6YeK0xNaWPKaiqXurixY55O2tis4ZXOKMTm45R4QVi6UZXVwBKylpuRYS23PsawOlgMWJhFEQg+NlhW8OLQ10OYD2xsdIHREQRFAZQYVMlgqYTH+K/fggwI8WSfHDQVyp8DgLgAAAABJRU5ErkJggg==","ht":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAgVBMVEUAIJ/wrrlem2OUYl6tt+Byflr6+vLSEDT///+GldHa4MKXmmankDdsnmtab8F+jct/iWuBtYv58/FwpnWzm6XPsKfx4+NyfJ+wiihYj1F/c5K7bSv53pbQhzhQZ5PsnFWdoKSEklU7hC5yjFBEhSyy0biy0rjjjF3liVyjk0thcZl/kvCwAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAh0lEQVQ4y+3Ltw6DQBBFUZjF4/EGcs5OwP9/IVCDrLHkwsXe4jVPx3Fstv/Jv20Fwb4+C3hEGCUmQiKPDSaA9xcAM5KSMuQCTIuxbccixTNwPeTmdS+GQfR17h7fMxAr3c1Lp1XMBFLpsmlKrSQPPF+QQFWBMY87C4jLVhjuK1jgcxZY8CuwAshAHHJa6ngRAAAAAElFTkSuQmCC","us":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAASFBMVEUZL13IXGIgNWIpPWjfoqXsx8nBSVC9PUT////ObnTmtLc8T3YyRW+YgJRMXYFba4yutsZqeJafqLvAxtN6hqGMl66EPlPb3uaw9+uDAAAACXBIWXMAAAsTAAALEwEAmpwYAAABO0lEQVQ4y72S247CMAxEB5vrOs2lbeD//3QnSVkJKXnIwzJC1ajIMz4GYKznrSPArwJkD9iqwJ4AXR2Q9tGA7RAkD9FMEwJEslbzfHRUqjUaEFZAVt8aq0G8d8T3gp2JPpUiE1g6GkcDPpbEwN0iGfIOuNK4ZyznjtASg5GhwHhGS20MI2gmbkxMZfXI1UNpjGF81rIxEy3UIpHD8LFcOjoYSqJtB4NurjIMoJmo8AbVajxUklYzOisTC0Pkctsnw7WjwoygDuZpvFNpxkRH0GFj4sa/kL3IsGYmvNiYVzxPHfFrY6LjR99GTKsZMtTEvRZx9fRuHA5YC3fVUNU4cVh+OmoM+GDQl2sMfWjevD3+jPCHL6Y/sIx17q50n9T8wGlSuE0K10l9AfoyqXno6YHzpL5wpcek/v9Kv1otLn8aeCfkAAAAAElFTkSuQmCC","au":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAe1BMVEUAAIsSEpP29vsqKp7/PDwLC5AFBY7/////AAD/KSkbG5hpabv/DAw6OqWOjszFxeX++PlgYLeDg8aXl9BVVbL+h4jMzOi1stupotH/HR3k5PNFRau+u9/X1+3/0dH/UlLr6/b/cHDbtsr/XV3+o6T/6up4eML/vb3wsLl/+IUtAAAACXBIWXMAAAsTAAALEwEAmpwYAAABjklEQVQ4y9VU2ZaDIAwVEYKIuFStS63Wrv//hQPacTninDrzNPf4YCA3uSEB6xpCbGnYDmMuEPVH4wtLrS0U7hlOfE7gnVM8YZNwakQKbTURkpdw7nDcJFhxypo7SDoQkEzZJQxj6wdUr0JJyAZC54gnlP7Sg5KljY4NSwF6QqHloOW+n0SzCDCiJ4yYETyAx2Q5IwRjYrImD36E4RwHsA3MSwgyau0hEIJmVbsjlCQ2WZuH+kHR34mQRwdpVEJ4EW+C6ltOjKG9uhz6jzM4u243NK6Gc+F0+N2geUNoDJDpjciGm2hy9B6NHO6NuHnaJZIymhF4XSZKUq7lpN40fH2Aaz40zFvMENcJejl4Pt641mtKUAy2RKtSdDS0vEDkAOFVlxAfrF+D4J3+p3on4/EHdROwv5Mg96Tlh4qWLfXlx7VJaEF9nychpR7qFpn2KDUNr60Jtmc6jCpZCeXB98UJuCFW+FhnxZF2j/D68qDlqzE9VxAEYO5ElpnuYBIQEiTGmjkyEXy1SHzrH+ILCK8ZDER09FkAAAAASUVORK5CYII=","py":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAM1BMVEX////b3NukpKRiwYTt7u729/fDxsQAOKjVKx7g4OCt2L7R7dqysrIqq1qY1bD/+Mn/9rZatYX3AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAaElEQVQ4y+2RSRLAIAgEZZEEcfv/a+MHkhqrcrTPNMuQ7k3SEY7wIvxD9kXG69WJmVzx/tVCiQmd4VZaz93MUYGbzBmlwkIVGaMXhgWzJkUIXimvfCKSwkevWHWBx7r/uE+uTY5whBce6DskMD2F4t8AAAAASUVORK5CYII=","tr":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAANlBMVEXjChfkEh7+8fL4wsXmHirpP0ntYmv////nLTnvc3vzkZfxg4n1pqrsU1z72dv2sLT6ztH2rrPnj1QWAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAt0lEQVQ4y+1USQ7DIAxkNdgsTf7/2WJSKSVVgnurqoy4YM3gHaVu/A08YIlitiMTGBW1iF863SbEbCVegOnrxtQ4V3jmp/06jco2fn67x36uHRg32h5XisQJjDVTdtE+nYnWJsDBomMN5mA7pABDjEs4ZDXz4KD1pZ4Wiz6ec6pWtCSvklZLZNkZOGT6og9bp/e0o5vOBrKCXjzwgunrCpOhlGS9aL7j2tchGHLiFYJEWPT98/w0niYrBXEcHpotAAAAAElFTkSuQmCC","de":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAACVBMVEX/AAAAAAH/zACrRy5BAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIUlEQVQ4y2NgJBEwjGoY1YBDwygYBdQCTCSCUQ2jGnAAAB5yBsEYQ5VsAAAAAElFTkSuQmCC","ec":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAB/lBMVEXaABCnz/+TPAACAcPXAhKWPgD/4AD/6AAAFI7hAAGdSgDtygEnAKGNXziNWTH+5wH95wiYQADSuiOcADerBQzOAA3sZgb84wO8fgDowQGv/3vYpQC4JjEVAq7flQAbF6/1+//w0wq8kSO9hiOlxe+1cwCsZAD14yzw/ezAhgDNtg/TDQpdXlrjxxNLTWv13wAXJHyjkiEtAJz01wAxK57g7//vswqbVRvgtQANFo0ICLvd1TvucgUuNHDn1jOl0eM+OZDo++Wp0cefxZCv+4fK4/+s6rHCwQDPPAfmJQDrsyrUwFYnIqFTNwBORIbiCwAETxnAAB8WAKLQnQDh2HyrACjYrxvPmQDisC2DUEqGNjnIlTb45ACrnC+uoUbUnx6ERhjs3QC309O32P3f1gDoUgXNzADF1aCHRjmsy5eSqwBrXHvNeg+PfFZbT36ycEbehQefllupprC5npnt+P/33xep3tdobSykttmu9JDBrTBARhjidAfBqyzoOwG+CwMcCafbzK/BjFvFjgDAi1vZ2m7o8//aUhD6wQBFAIj50Qmwts2UuOKyiHrbqFWsjQATOkCAWh2o1PGztQCZV1isxH2VWByGeD3zqAm42IWw6IxUhgD1mQHa6N03Uii/yHJ2KwDhvIikMRno4udIH120nDncLQYvKJKnYzI4On599dycAAAACXBIWXMAAAsTAAALEwEAmpwYAAACZUlEQVQ4y93Qd3PaMBgGcIyxjGwcpgkjkDBTIKwws9MkQCB779nsvffu3nvvcdevWZH2eiV3Ua5/to8tnaV7fye9FtB/GcG/AKRRh92WjT4Cti5WeiFgNQwllwuZCNempyiK0WixINsupCghJaeEwxwqp4QojF56PpCxbZouh51BRk7JbRq7lg1kyzAnSNu707envTaG0UjpfnRmd7sU14Osz0l7R2iv1uFgAvTIRL+zT4bpIT+fHmJfTsx4E9HoVdTt2MwmO5TePQ/IrikUet/w08T65OjodUCP7T7SKxQnsvOvZPEjcPhivaqqpLxiEjxuaH6o8FswPVhM/kRRw9Lz6umSkunq6tqG5rd+ExawjZu+plQsFrtCEMTWu0/NHxq1Zgwwh4NH3w6OQ2t5N9Iidbh7FAzjwL6xXsLPfV3LQwmFQp+/8JJ64z4G7BhzC+He+0uX0YPe41ooyTXuZALxn/GkQekbXU1FvEan031MpoEnoyQTFIBcCRx/XbNBEFXbOl1dEwKgAAM8IGiAybr4E8J6z1oRD0NoCALcCWWgkeThq+0N64p1ZWtVDXlyAZRhgA/Mk0p4UEcQq4uL98NNUEnOAx8GiN1ushBC9QMrQdxNJSEsJN1uMQ4MgIXi2WeuvTvl5bdqXfxtchYMYEEBMFVWfp/iIhwXyZoyFFeazvyks6DICRTLy1zWabjBQRNwis+AzOS41KU3VUvmnt7eHvOcarxU7coRYCISoaESqDvJjo7iTrVAJfq5h40KDQPJ86QhvbioWiDKQSUtklYIWyUtv5Z4cDoplRAqlaLfG/9ZfgBMXYS93e6H2wAAAABJRU5ErkJggg==","ci":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAADFBMVEX/mgAEzQQAzQD///9hc8KiAAAAAnRSTlP//Sa7vusAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAiSURBVDjLY2BAA8xogJEJFTCMahjVMKphVMOohlENQ0MDAAjICx2Fx+unAAAAAElFTkSuQmCC","cw":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAJ1BMVEUAK3/56BQSOHduf1AvUZf8/f4ZQIyHnMNwiLdYdaynttPAy+Dl6fJDB8j/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAVklEQVQ4y+2SyxGAUAgDUQn//uu1hniRw9szmcwCIksxJQMR1Lj2oKiOBIyqcPfknD+qZ3Cb1W5VoqQAjDPyDXDqM1PU+cok5PATD4lcJBsDN8l5kx2827EDGwRSAPMAAAAASUVORK5CYII=","nl":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAACVBMVEUhRouuHCj///+QNKGcAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIklEQVQ4y2NgJBEwjGoY1YBDAxOJYFTDqAZcGkbBKKASAAB1CAbB7XoNfQAAAABJRU5ErkJggg==","jp":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAHlBMVEW8AC3////23OLxx9HEH0fRT2799vjZbIbBETvtusbXZ/rbAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAe0lEQVQ4y+3Uyw6AIAxE0bHl+f8/LCtisBTGuOTuTyJYiosMB/SSSNoHmgNaIesWkIhelDWoBY9KXYGKoeoDKSMo4oKIV9EDCiN1QLZAdkCwQJiDBLM0BWID+Q/Qn0Qfmr9W+sfRo8EPHz3e7RjkA+KfKL8EPqyZs73HbmIYBnvE5mMQAAAAAElFTkSuQmCC","tn":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAOVBMVEXnABP+7u/sMkL//f35t736ys7xZXH////95efuQE7vTVrzfojrIDHwWWX1kZn81tn++Pn3qK7pESOGRAUNAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAyklEQVQ4y+1UOxbDIAyDGCzzJ7n/YWtoO+O5r1pYLCEhJ8798Ttot4Dkzsbxa+CDeFnm8wQFTokDwSeD/sRYwokbC3w9EgbGo9eIOqI4EY55QarfCGG+c5xM3Uvz8UApeoMS+oEgYOdYB4trz63nOBBoeegz8LPsKbyJQLHo82QyELalti1x7as8U2jZoTEMoTMo7bYjvZ/1uB0RovbTEp/BUJyrHrLKunJmv8knJG0tltyK1iamda3hu96hGr+I1KNI7Nf/V/JDeAGa7QexudB4cwAAAABJRU5ErkJggg==","se":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAD1BMVEX+ywAAUpOZmzrMsx1mgljGtLAUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAM0lEQVQ4y2NgRAbMDGDAwogbMIxqGNUwYBqYkAFEPQMzE27AMAqIASQH62hqHdUwZDQAAPgEBcvG0zknAAAAAElFTkSuQmCC","be":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAACVBMVEUAAAHzGDD/2QzxfauxAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIUlEQVQ4y2NgQANMaIARDTCMahjVMKphVMOohlENQ0MDACW9BsGKk9msAAAAAElFTkSuQmCC","ir":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAUVBMVEXaAADdDw/98vLeGBjoX1/mUFDqaGj///8jn0B6xYyFypVwwYP8+fju+PDtg4PjPj7rcnIkn0HfICBiu3f1traPz57wlpb62dnyoaGW0qOf1avQcDkaAAAACXBIWXMAAAsTAAALEwEAmpwYAAABCklEQVQ4y+2R227DIAyGORhTDgVGCCR9/wedvXTTWuWCXlaqhcD5+D8Jgvi6vFbiI7yp4HbnFufWEJzzPgTvV+cZMPXeLZ7ae4IjYiWwuHDz/LnubLidwM4gPADSlpuwV0vjGo/1d0SqB2BjPELCnpUaiEOdbp0KqSkA1dKsgBQFIA3nhJHbxkJveUwJraTNItgtlTYp9MRC6ZOCMqPGgqoOo+Yu3QdAQYDRZ3/riLnWHMf0O8TWa+0tngt0TsUP/7P+DaWeACc4JNAYk+nAJsPR3oF5BpQw1AromAzAVtBASgkBe0mZQAK6eqcZt3IkCs9Ca1mF1FVqya3kloCsmgFN8n+Cuk+9Z30DjrgrCF5QO90AAAAASUVORK5CYII=","eg":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAIVBMVEX////OESYAAAHt4bfz6s7n1p7Mpy748uDYvF/7+O7hy4No58GOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAZ0lEQVQ4y+2RSQ7AMAgD02Kz/f/BTe6NBHdGghMjYXk9TdYII1yEC8TqYda6DhPsVRZUDDDRuuBOuneEJLMuhDpF6BrVzOqyca2mhhKZoFa7wHnoTLk8yDmXetkB7Az4z/w2GWGECx/RtQjAHr8iJAAAAABJRU5ErkJggg==","nz":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAilBMVEUAJH3KGDUKKW7PJ0DRNU/VSF/3+PrIEC7///8BIWkSM4ZDXZ0kQo/ZXnFTaKIUMnQHKoH10tg6U5TeiJjdaXyiq8aEkLXfeouytcz+/P0qRYF4g7HUPlT88vSTnr5idKPlk6HR1+TavcnGwNHv6O3tuMHqprLXU2Wtob7BnLOwhKHKepDGjqTZWmogTpa5AAAACXBIWXMAAAsTAAALEwEAmpwYAAABPElEQVQ4y+2T2ZKDIBBFRVDaBfclLlGTmD3z/783CJZQNePU+JC33Bfpog91e9HI9lXhTLItSgmY/GQWJU2NNWESwynUgfpk4TOsAieGBhg9BQRnbI2wWwWcYkBsD50pgbBLaVlxl+uAkxwJjuEgAWFnTJy/ACfcMTpUIABhZyppFYBFAlik5yR6YC1ClCIV6TkPTwvoilSGf8fXZgtgJF9PLSKLJksq0lI8N4i2FS0VLW01O7AzJIEqRWVu/trWwp2B+gBxS45ycPxM2mM9A76yEt3aNBBAb8MZsV04r0YOe4YujQQegdas60t8c7BLNPRq+fgDF5Tl/Mq9Y6tTvXLlNLgFMlnQ1nuyJbrks/JnKfw1sTv6D8RtZbKfnmt89C7py/ovPftN6V6K29umAQaEbXPU+I3/GeR79Q19/Bbiw99p7wAAAABJRU5ErkJggg==","es":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAApVBMVEXxvwC6XhDThRDZtgS6VQ/qugjnpwOqFRvtwg62RxO6WCvEcUTIsRjJlwrwvQHixFHQkD/XxIfgpxbclwzqswrDaQzARRHRv8bKe0LNmXSUOzqho13IrXTUmk3AayS9Wke3qCTaxnezNxOwJhbAng3kirLUxpzYqr2lpVzduRqho2C5vJDWtiPTw5StYxNJenmehDGlQSGnYiS2fYhUT265UB/GqxL8fMgEAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAvklEQVQ4y+2UyRaCIBhGAYEY1FRU1NJK0+a593+2PL1Af5uGc/yA3b2LuwGN3hwahN8QPj7nLVoIMe8fnDck9VJiwAajUvY3AeKEoNhb9ochw0G5Dk9pmnVhJxxQ+njBGw/rVWvFYgzg/UAnzfyqbWuJDvzXPNc5qc+X+21lTV5BIspZhFVxKpSKZiWA51kYJZgWktbxIYsh0U9B0aOMQ1C067IK41xKxVwXIkwmGxZMd9OA7bdr9M0N/9J/Cg/USiMVp3na9wAAAABJRU5ErkJggg==","uy":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAS1BMVEX////XsxO1lxTLqBG/pTL8/PzHt3IAOKj19vn08+/KvonRy7fNw5XDs2nCq0epo4e6taOPhlzo5NSjkkbp5diiiyjc0Z7CoRH80RbpHzwrAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAt0lEQVQ4y+2SSQ7DMAhFzWBiPMWZc/+TNm33FVmkiqq+HRIPgT7OfQ8NZ7p9cylpbx7uw6Qxx+y8HmXoPvCeP4xSRXidB28S3LwUYIa4jMEbhD6vQhsiU5GpGQSNDIwAuEFVw8khZTn6iQC5xKQmoeJOtL8ESxxaYSNEOjaLlp3aJIUYcSNZc2842od5EeAKsozOGtzK5cjOGpx6l2PMOgXjazzD05Rc89e995V0J7mj8Av8c7gFD7ivF0To1ZnzAAAAAElFTkSuQmCC","sa":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAARVBMVEUWXTG+0sZ2oIZsmX2jv61DfFkaYDWzy7xViWlfkHI3dE5Mg2GYt6QjZz2EqpONsJqrxbXU4tnG2M1+pY0tbUXk7ej3+fgX8cxaAAAACXBIWXMAAAsTAAALEwEAmpwYAAABA0lEQVQ4y+2TSY4DIQxFCw/YZh7r/kftpHvVUiVRdlnkbRDwnwAZH8eXT2N5n/19WItzuM38C0EBCsVDos5UaQsiWK41ZbzOs/ZdmwEWgqkl7QClHaNL6flSwCk7kUWopbsxbMNEinUndtd3WzBGitMHBLXorDWeTU1GpPXgDYVcP7trZQY8C4gmyjUJlXiZzxhTc02zmtunQEEhWjFhn3op+OwitMrYw9bbScWwJsZqJNeCchs0eG6WJpSDscFMskMofCmAjj6s4uh2mARYVbzUw6c5Hlbw/0b+W/Hh2wTPya8C999A4n6RRqmXac+NYKqROQRmjqoi7nyva3OI38J8Ij/RMAx7ehBAyQAAAABJRU5ErkJggg==","cv":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAV1BMVEUIF3L75uQQHnFNS1Xqe27p6vI6R5D///8IGHPeOSkbJmv+zxIwNmFsYkf65q2SfjegiDH95Yr/2kHgQyr//OzSrRu7nCVAS4/+3GXmvBOrkCxIUYf/99Qzu+6zAAAAAXRSTlP6HY7DZAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAN5JREFUOMvtlNsOwiAMhhl1Dst557m9/3OKMZoVpoELr/QnJLTk41BKGRNlYn/gtwEsAzg65NkABMDKQQmhcgCuB60EOCs4jKAydgDpAhZaGI08BwD9HGl9dKToRMn9E6Am8tSsjYkcNWv28rLd9raR0jRUFNjamU63bRMDp0Kx7lKmCIjxLlmPVUTeENPMM3VUVRwlGpVeyv5jlPooKr33CTCdd1qnldgHYsnbq9fnwaP8TgC4WnikEDgHGQDKIbhs6LgsmJHeCJpzd/9xqDXmFgEYbVnVwPdl4/uF7Ab8pTS1LRSXXwAAAABJRU5ErkJggg==","fr":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAACVBMVEUAAJHhAA////9PGWorAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIUlEQVQ4y2NgQANMaIARDTCMahjVMKphVMOohlENQ0MDACW9BsGKk9msAAAAAElFTkSuQmCC","sn":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAIVBMVEULcib//wC8AABuqxbS5QeozQ3w9gI5jR4jgCJfoxiMvRI2fmCHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAb0lEQVQ4y+3TOQ7AIAwEwE3wyf8fHAhIkaiWOrjBFAO2EcAS1xL3Ejjg58BkE2jdBOl7wADbAgooC7S0cMD7qswN+m3SqJIkZq5sD+Y9C+GbfsGYEwWkHR9zThSocLFE0sDLy4IvabyZyPmiB/DgAaj/B5AH0vq3AAAAAElFTkSuQmCC","no":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAFVBMVEW/ydj2lJwAJmTtKTn///+Pobv7ys5Uz83/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAASklEQVQ4y+3TQQoAIAhE0dGs+x+5ggILDISgFr79X6iIpJGAGwglCyKI4FZAWplBIQtkNQIbNrkHGQfs9GPgHtq9Vvfh4h8ieBVUXsoQ8eSynPoAAAAASUVORK5CYII=","iq":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAKlBMVEX///8AAAHOESZ5uZqr079Wp3/0+vdCnG8ThEvi8OkylWTJ49aTx61osIzF9wXAAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAbUlEQVQ4y+3PMQ7AIAhAUVpARPD+162SrladuvgHogkvRrg3gwMOGID/SjF1bRkJgPuukhEv7HsbEk8QLgBESK4BnCcgGVTLtYpwB15mQLPkErFIu7Uo45cQfCPHpP1g8aNRZqrwe9dmBxww6AHOMQlFenDkGwAAAABJRU5ErkJggg==","ar":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAKlBMVEV0rN/////Uolfx4c7nzKTlyaH9+vbivofopRDhnBDft3zMiyXq0q7oz6oOOcO5AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAYUlEQVQ4y+3SQQ7AIAhEUQuMKOr9r1vdNw0kLnn7nyBYSkqXPEHfQeUFrv6ABWoQ9gZVlDaV6gwYNFobBHYGMOob6XQGU6ltZAiM1HtgpPCjz1pNA2s9h8OKHO73a6R0yQtTbgPdmfXqQgAAAABJRU5ErkJggg==","at":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAABlBMVEXIEC7///94b0yLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAHklEQVQ4y2NgGAWjgEqAkUQwqmFUAy4No2AUUAkAAMfNAkFm+0mSAAAAAElFTkSuQmCC","dz":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAASFBMVEX///99MTPHFDQfVTP+9vjaNlSyHDMAYjPSEDT2zdX64eY2TTMEYDPzu8XTFjmgIzTkb4XWIkNePTPdSGTog5bogpXrl6dIRjPhKILSAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAlklEQVQ4y+2USQ7DIAxFIWCKmTK2vf9NY6eRukJgqYtGildfwk/y94B6VELV4gb+F4ja+QJT7gTM6CkKwLyGHiAOlO7elt5wwjZgOF+n0wOGJsD16K9p2wIi15NOYLNtD5qAhUUOKvsOwBFgWGCBuQdgy+kY3IsUPPHngLgksWlxW8WDk6+GePnk6/05oEFwQPe/dAVgBwr4GvektSp6AAAAAElFTkSuQmCC","jo":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAJ1BMVEX/AAD///8AAAEAmQDEEwD+AAD/OTn/srJNAAFMbAD/YmL/6Oj/gYGXeOrjAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAlklEQVQ4y6XS7Q5AMBBE0aEUrfd/XiJCsdvOxP7Ue+JrMcy9NBihkR1AIgdQyAl4cgGWFIAjD8CQF2iTD2gRA9SJCWoE3sSpMwcQCSASQCTFWUyRIMVR7hJxl/t6ynmVANYE7ZHUl/7/WcUf566Gs3xLcMZebzc3QS03QD3/gFb+Au38AZi8AFx+ATY/AZ8fQMl3oOUhbP+QC6shyt5oAAAAAElFTkSuQmCC","pt":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAA2FBMVEXCFwD9Qzf/////GAEAZgD/AAD/cQDDGwDoqwDzilX/uAD//QD+9QD/NwP/JQDwmlD/5gD+TwJ5rwDm8ABLkwDCzufuelD/2AD/iwDz+ACVwAD/qwD+owDY5wD+g4D6fByGn8//ZGT/CQIcdwDJ3wCw0ACLugCkyQD/0AD5h1JqiMT9lAD/5+a6jU8PbwBspwBvqgDA2QDMiVPekVKyutl5lMr5nzuhwxBUdrulqzyDnjTz5CTRxjn/y8v/jo79dkP9mgD2k3Cxs9L9ZivPmVEzhAD+PCH9VFDgc72XAAAACnRSTlPX////////1+/9UdbkQwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAQNJREFUOMvt1MlugzAQBmCMa9JiG7OFfU2AQIDsSfe97/9MIeqxUu0eKrVS5v5JM55/LF18LQl9U9IZ/Fkw+gmYmmuL1C0VBas4sO1LTanDiRCoHvq+/2CO47AaCoC1zyINGS1CbarrEy6YYswUkDeHPFfeVeJxwcrCDCXyeC53CGiGygUzs2R0AJncUaBoOhdYcbUNX+e7ffb2kiohoXww28DkZrzPdhB4KjH4LdkblJ9aekTAE2hpWS7uoNENQz/ThkT8oRd+HDgqTZ5AlN7ruOUvrvSLa+e0L3BwMRaJRlAszdvtVTO8kQuFwmdan+FzVSga76rwiRsZv3dA53/pn4Aj33ExGRqC6e8AAAAASUVORK5CYII=","co":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAACVBMVEUAFI7aABD/6ABoOGJhAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIUlEQVQ4y2NgIhEwjGoY1TCqgQINo2CIAkYSwaiGwaEBAF9YCHEJ8WnfAAAAAElFTkSuQmCC","uz":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAJ1BMVEUAmbUetTr////zx8xzZjBjV3A/ssghp7/R7fKu3+iM0t5ow9T2/Pw5PAP4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAcElEQVQ4y+2SSw6AIAxEK2o/lPufV1CCK5FxZ/QlDUPS6YdA9BR2lirlCOnmm51ahWK+ai8/KjhQcnCBwFW5DY0kzSB5VW7HNRrRR02lXo3SgW86EJvvww/ugLCC0AxCAeQ3vNUAf40FhCaQ3/AVwwaIRgpyP34SDQAAAABJRU5ErkJggg==","cd":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAQlBMVEXOECF8qosgi+GuvFzu0yBKmrrXyzYAf//31RgJg/fcUR7rnhvjcxzExEjzwBnxuxnVLyDUKyDlgByctm41ks1rpZsplVAOAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA6ElEQVQ4y5XR3QKCIAxAYVDAodKf+v6vGjKykcbGbrpwRz5JDfLperiNSrzutYGXUkewMvvWwfRQJFhWXqNI4I3mNTSwEHgNDRaAjtXkwIY4BsDFn8VfaGayPu8nrA7ynPZLjRrvkEi+T+tmq2ueEzibvyGdsVXuZteA0X7AoEMQo+n3a8Fgi3EA4+ua9ACD4OL/rMHWNd/Ap8MGq+saEnxeXNcQEns3/4Oa5iKoa04Bp/kNWE0ZCDQ0EGlIINMcgVSTA7kGgwYNBg0aDGa5BoMGTRkINEUg0ZBApjkCqeYTiDUYNGjSvAEQbikQ9t+VDwAAAABJRU5ErkJggg==","gb-eng":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAACVBMVEXOESTULT7////YMQEsAAAACXBIWXMAAAsTAAALEwEAmpwYAAAALklEQVQ4y2NgwgYYGYCAEasUw6iGUQ1DRwMjNsAABnikhjgg2dOjaWlUw/DVAADjQQppUwj8fAAAAABJRU5ErkJggg==","hr":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAzFBMVEX/AAD/3Nz/Bgb/UlL/9vb/ra3/uroXF5b/////WFgFlNv/EBE1pOD/dHT/CAj/7u7/MzOWlrT/sbH/0ND/GRn/Rkb3HSGDW5+pfpdGgm7ZaXtQdb3JYns4GIWGQ4GMkCrXBRtTTKk+gIYaF5RqMoTSXWrnQ0vyr7f/vr7rPkN1pc3/xsb/oKBaqtnEfY0sMaM7EW4ng5RGOFalkxxukrajb5mrCDdvGmg9nMSxX4r/WlqzYYqtQkShEhJyfrVKbJlsRzIVmdp3N4L/qKgQIYA/AAAACXBIWXMAAAsTAAALEwEAmpwYAAABE0lEQVQ4y+3Q126DMBQGYEPAeIFN2CuM7L2T7vb9n6pVJNSqEMFFI/Ui/5Wt/3yyjgG45xLj2ZVNU3YfjTbTQ3PqJefDdntYa97UHDbNUxaQLDsVafr+sVmT9IE2gBEJSL45R0UR7fdvjJBR0xNLwnrZKQqCaLdbvb6YjTvEjLHcO/r+0cvZchU2Annmu+XZ9WdyZQD9jo6xJHUx7koSxnqlrgIMgIJUAFSkAIBvASCEjqNDqDvO17EFkBCSQQehDjAul78HuhBzayHEwpoL8T9+acK5TTHnT9TmfNICqD+XVlsAi38DxaoCrZKYljvQuNrWgH5YgrDfCmhabwxtG457dV0t0LRkMEjqmyvgeu7gJuATUSUv9ONBIssAAAAASUVORK5CYII=","pa":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAATlBMVEX///89Pb/jOTnYAADe3vXlRETExOwAAKvbAADfGhrujY339vt6etNlZc34z8/86en0srKYmN3jTU7R0fC9verZBQXrc3MeHrVJScOzs+ZxeqOMAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAn0lEQVQ4y+WSuw7DIAxFKaShBvPMs///o8VTVQkke0mHnMHTPdhGVmrA/uwzyiv96nOxsC5CIaBQOA6BUBCDtQGxMAXf4kTw7JEK5d+CHVYSFoEQbEGLAuFsr88nX/D+W/97S9OACn3Uw/aZR61vImSpAEkmZOP4QnLOaQOtRmaHCIaAzB7J15bXSbADCSBYOm017ibyhUxfFN3tju+HD3TiHZCTCJe/AAAAAElFTkSuQmCC","gh":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAMAAAD4m0k4AAAAJFBMVEUAaz/OESb80RYAAAGWfA3atBIxKQXwxxRjUgl8Zgu/nhAYFAO5v/fgAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAZ0lEQVQ4y+2QSw7AIAgFbZGf3v++tdolJJB0yWxc4ATea1eSVkIJjnDbIDoDT1BNCkQ5AQEwKnBfCIC8L0c2IMEHjdhJLOe/cDjDNiQReh9FcWF1pOr0ZAp9rrRj9rjAp19TKIqfeAB70QesNmCfBAAAAABJRU5ErkJggg=="};

// Official 2026 FIFA World Cup draw — 48 teams, 12 groups of 4. [name, ISO code → flag image]
const GROUPS = {
  A:[["Mexico","mx"],["South Korea","kr"],["South Africa","za"],["Czechia","cz"]],
  B:[["Canada","ca"],["Switzerland","ch"],["Qatar","qa"],["Bosnia & Herz.","ba"]],
  C:[["Brazil","br"],["Morocco","ma"],["Scotland","gb-sct"],["Haiti","ht"]],
  D:[["USA","us"],["Australia","au"],["Paraguay","py"],["Türkiye","tr"]],
  E:[["Germany","de"],["Ecuador","ec"],["Côte d'Ivoire","ci"],["Curaçao","cw"]],
  F:[["Netherlands","nl"],["Japan","jp"],["Tunisia","tn"],["Sweden","se"]],
  G:[["Belgium","be"],["Iran","ir"],["Egypt","eg"],["New Zealand","nz"]],
  H:[["Spain","es"],["Uruguay","uy"],["Saudi Arabia","sa"],["Cape Verde","cv"]],
  I:[["France","fr"],["Senegal","sn"],["Norway","no"],["Iraq","iq"]],
  J:[["Argentina","ar"],["Austria","at"],["Algeria","dz"],["Jordan","jo"]],
  K:[["Portugal","pt"],["Colombia","co"],["Uzbekistan","uz"],["DR Congo","cd"]],
  L:[["England","gb-eng"],["Croatia","hr"],["Panama","pa"],["Ghana","gh"]],
};
const GROUP_KEYS = Object.keys(GROUPS);
// Group-stage calendar. Day 0 = Jun 11 2026 (opening day, Mexico v South Africa).
// MD1 pairing (0v2, 1v3) makes Group A open Mexico (A1) v South Africa (A3).
const RR = [[[0,2],[1,3]],[[0,1],[2,3]],[[0,3],[1,2]]];
const matchDay = (gi,md)=> md*6 + Math.floor(gi/2);   // 2 groups share a date; staggered Jun 11→27
const DAY0 = new Date(2026,5,11);
const fmtDay = d => new Date(2026,5,11+d).toLocaleDateString("en-US",{ month:"short", day:"numeric" });

// status relative to the date the user is viewing (asOf, in day-index)
function statusOf(m, asOf){ if(m.day < asOf) return "finished"; if(m.day === asOf) return "today"; return "open"; }

function seed(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296;};}
function pick(r){const t=[0,0,1,1,1,2,2,3];return t[Math.floor(r()*t.length)];}
function scorePts(ph,pa,ah,aa){if(ph===ah&&pa===aa)return 5;return Math.sign(ph-pa)===Math.sign(ah-aa)?3:0;}

function buildMatches(){
  const out=[];
  GROUP_KEYS.forEach((g,gi)=>{
    RR.forEach((day,mdIdx)=>day.forEach(([hi,ai])=>{
      const id=`${g}-${mdIdx}-${hi}${ai}`;
      const r=seed(id);
      const preds={};
      PEOPLE.forEach(p=>{const pr=seed(id+"|"+p.id);preds[p.id]={h:pick(pr),a:pick(pr)};});
      out.push({
        id, group:g, matchday:mdIdx+1, day:matchDay(gi,mdIdx),
        home:GROUPS[g][hi], away:GROUPS[g][ai],
        actual:{h:pick(r),a:pick(r)}, preds, // result pre-rolled, revealed only once finished
        odds:[(1.8+r()*2).toFixed(2),(3.0+r()*0.8).toFixed(2),(1.9+r()*2.4).toFixed(2)],
      });
    }));
  });
  return out;
}
const KNOCKOUT = [
  { round:"Round of 32", date:"Jun 28 – Jul 3", ties:[
    ["Winner A","Runner-up B"],["Winner C","Runner-up D"],["Winner E","Runner-up F"],["Winner G","Runner-up H"],
    ["Winner I","Runner-up J"],["Winner K","Runner-up L"],["Runner-up A","Winner B"],["Runner-up C","Winner D"],
    ["Runner-up E","Winner F"],["Runner-up G","Winner H"],["Runner-up I","Winner J"],["Runner-up K","Winner L"],
    ["3rd place","3rd place"],["3rd place","3rd place"],["3rd place","3rd place"],["3rd place","3rd place"]] },
  { round:"Round of 16", date:"Jul 4 – 7", ties:[
    ["Winner R32·1","Winner R32·2"],["Winner R32·3","Winner R32·4"],["Winner R32·5","Winner R32·6"],["Winner R32·7","Winner R32·8"],
    ["Winner R32·9","Winner R32·10"],["Winner R32·11","Winner R32·12"],["Winner R32·13","Winner R32·14"],["Winner R32·15","Winner R32·16"]] },
  { round:"Quarter-finals", date:"Jul 9 – 11", ties:[
    ["Winner R16·1","Winner R16·2"],["Winner R16·3","Winner R16·4"],["Winner R16·5","Winner R16·6"],["Winner R16·7","Winner R16·8"]] },
  { round:"Semi-finals", date:"Jul 14 – 15", ties:[
    ["Winner QF·1","Winner QF·2"],["Winner QF·3","Winner QF·4"]] },
  { round:"Final", date:"Jul 19", ties:[["Winner SF·1","Winner SF·2"]] },
];

/* ------------------------------------------------------------------ *
 * Shared atoms
 * ------------------------------------------------------------------ */
function Avatar({ p, size=26 }) {
  return <span style={{ width:size,height:size,background:p.color,color:"#0A0C26",
    fontSize:size*0.42,fontFamily:fDisp,fontWeight:700 }}
    className="inline-flex items-center justify-center rounded-full shrink-0">{p.short.slice(0,2)}</span>;
}
function Flag({ code, size=15 }) {
  const w = Math.round(size*1.45);
  return <img src={FLAGS[code]} alt={code.toUpperCase()}
    width={w} height={size}
    style={{ width:w, height:size, objectFit:"cover", borderRadius:2, flexShrink:0,
      boxShadow:"0 0 0 1px rgba(255,255,255,.10)", display:"inline-block", verticalAlign:"middle" }}/>;
}
function Tag({ children, color }) {
  return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold"
    style={{ ...up, color, border:`1px solid ${color}55` }}>{children}</span>;
}

function Scoreboard({ home, away, left, right, accent }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Flag code={home[1]} size={18}/>
        <span className="truncate font-semibold" style={{ ...up, fontSize:14 }}>{home[0]}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="rounded px-2 py-1 leading-none" style={{ fontFamily:fDisp,fontWeight:700,fontSize:22,background:C.bg,color:accent,minWidth:36,textAlign:"center" }}>{left}</span>
        <span style={{ color:C.mut2 }}>:</span>
        <span className="rounded px-2 py-1 leading-none" style={{ fontFamily:fDisp,fontWeight:700,fontSize:22,background:C.bg,color:accent,minWidth:36,textAlign:"center" }}>{right}</span>
      </div>
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span className="truncate font-semibold text-right" style={{ ...up, fontSize:14 }}>{away[0]}</span>
        <Flag code={away[1]} size={18}/>
      </div>
    </div>
  );
}

function Stepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={()=>onChange(Math.max(0,value-1))} className="grid place-items-center rounded" style={{ width:26,height:26,background:C.tile,color:C.mut }}><Minus size={13}/></button>
      <span className="grid place-items-center rounded" style={{ fontFamily:fDisp,fontWeight:700,fontSize:18,width:34,height:30,background:C.bg,color:C.text }}>{value}</span>
      <button onClick={()=>onChange(Math.min(9,value+1))} className="grid place-items-center rounded" style={{ width:26,height:26,background:C.tile,color:C.mut }}><Plus size={13}/></button>
    </div>
  );
}

function MatchCard({ m, asOf, myPick, setMyPick }) {
  const status = statusOf(m, asOf);
  const finished = status==="finished";
  const today = status==="today";
  const breakdown = finished ? PEOPLE.map(p=>{const pr=m.preds[p.id];return{p,pr,pts:scorePts(pr.h,pr.a,m.actual.h,m.actual.a)};}) : [];
  const exact = breakdown.filter(b=>b.pts===5).length;
  const result = breakdown.filter(b=>b.pts>=3).length;
  return (
    <div className="rounded-lg p-3" style={{ background:C.bg2, border:`1px solid ${today?C.magenta+"66":C.lineSoft}` }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px]" style={{ ...up, color:C.mut2 }}>Group {m.group} · MD{m.matchday}</span>
        {finished ? <Tag color={C.mut}>Full time</Tag>
          : today ? <Tag color={C.magenta}><span className="h-1.5 w-1.5 rounded-full" style={{background:C.magenta}}/> Today · {fmtDay(m.day)}</Tag>
          : <Tag color={C.cyan}><Lock size={11}/> {fmtDay(m.day)}</Tag>}
      </div>
      <Scoreboard home={m.home} away={m.away} accent={finished?C.lime:today?C.magenta:C.mut2}
        left={finished?m.actual.h:"–"} right={finished?m.actual.a:"–"} />

      {/* OPEN: editable pick */}
      {status==="open" && (
        <div className="mt-3 rounded p-3" style={{ background:C.bg }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ ...up, color:C.cyan }}>Your call</span>
            <div className="flex items-center gap-2">
              <Stepper value={myPick.h} onChange={v=>setMyPick(m.id,{...myPick,h:v})}/>
              <span style={{ color:C.mut2 }}>:</span>
              <Stepper value={myPick.a} onChange={v=>setMyPick(m.id,{...myPick,a:v})}/>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {PEOPLE.filter(p=>p.id!=="you").map(p=>(
              <span key={p.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background:C.bg2,color:C.mut2 }}>
                <Avatar p={p} size={16}/> <Lock size={10}/>
              </span>
            ))}
            <span className="ml-auto text-[11px]" style={{ color:C.mut2 }}>odds {m.odds.join(" / ")}</span>
          </div>
        </div>
      )}

      {/* TODAY: locked, awaiting result */}
      {today && (
        <div className="mt-3 flex items-center justify-between rounded p-3" style={{ background:C.bg }}>
          <span className="text-xs font-bold" style={{ ...up, color:C.magenta }}>Locked · result pending</span>
          <span className="flex items-center gap-2 text-xs" style={{ color:C.mut }}>
            <Lock size={12}/> Your pick {myPick.h}–{myPick.a}
          </span>
        </div>
      )}

      {/* FINISHED: reveal + scoring */}
      {finished && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-1.5">
            {breakdown.map(({p,pr,pts})=>(
              <div key={p.id} className="flex items-center gap-2 rounded px-2 py-1.5" style={{ background:C.bg }}>
                <Avatar p={p} size={20}/>
                <span className="text-xs" style={{ color:C.mut }}>{p.name}</span>
                <span className="ml-auto" style={{ fontFamily:fDisp,fontWeight:700,color:C.text }}>{pr.h}–{pr.a}</span>
                <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ ...up,fontWeight:700,background:RESULT[pts],color:"#0A0C26" }}>+{pts}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color:C.mut2 }}>
            <span><b style={{color:C.lime}}>{exact}</b>/4 exact</span>
            <span><b style={{color:C.cyan}}>{result}</b>/4 got the result</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Standings table per group
 * ------------------------------------------------------------------ */
function standingsFor(matches,g,asOf){
  const tbl={}; GROUPS[g].forEach(t=>tbl[t[0]]={team:t,P:0,W:0,D:0,L:0,GF:0,GA:0,Pts:0});
  matches.filter(m=>m.group===g&&statusOf(m,asOf)==="finished").forEach(m=>{
    const H=tbl[m.home[0]],A=tbl[m.away[0]],{h,a}=m.actual;
    H.P++;A.P++;H.GF+=h;H.GA+=a;A.GF+=a;A.GA+=h;
    if(h>a){H.W++;A.L++;H.Pts+=3;}else if(h<a){A.W++;H.L++;A.Pts+=3;}else{H.D++;A.D++;H.Pts++;A.Pts++;}
  });
  return Object.values(tbl).map(r=>({...r,GD:r.GF-r.GA})).sort((x,y)=>y.Pts-x.Pts||y.GD-x.GD||y.GF-x.GF);
}
function StandingsTable({ rows }){
  const played = rows.some(r=>r.P>0);
  return (
    <div className="overflow-hidden rounded-lg" style={{ border:`1px solid ${C.lineSoft}` }}>
      <div className="grid items-center px-3 py-1.5 text-[10px]" style={{ ...up, gridTemplateColumns:"20px 1fr 22px 26px 32px 26px", color:C.mut2, background:C.bg }}>
        <span>#</span><span>Team</span><span className="text-center">P</span><span className="text-center">GD</span><span className="text-center">Pts</span><span/>
      </div>
      {rows.map((r,i)=>{const q=played&&i<2;return(
        <div key={r.team[0]} className="grid items-center px-3 py-2 text-sm" style={{ gridTemplateColumns:"20px 1fr 22px 26px 32px 26px", background:C.bg2, borderTop:`1px solid ${C.bg}`, boxShadow:q?`inset 3px 0 0 ${C.cyan}`:"none" }}>
          <span style={{ fontFamily:fDisp,fontWeight:700,color:q?C.cyan:C.mut2 }}>{i+1}</span>
          <span className="flex items-center gap-2 truncate"><Flag code={r.team[1]} size={14}/><span className="truncate" style={{ ...up, fontWeight:600 }}>{r.team[0]}</span></span>
          <span className="text-center" style={{ color:C.mut }}>{r.P}</span>
          <span className="text-center" style={{ fontFamily:fDisp,color:C.mut }}>{r.GD>0?`+${r.GD}`:r.GD}</span>
          <span className="text-center" style={{ fontFamily:fDisp,fontWeight:700,color:C.text }}>{r.Pts}</span>
          <span className="text-center">{played&&i===0&&<Crown size={14} style={{color:C.lime}}/>}</span>
        </div>
      );})}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Views
 * ------------------------------------------------------------------ */
function GroupStage({ matches, asOf, myPicks, setMyPick }){
  const [mode,setMode]=useState("group");
  const [sel,setSel]=useState("all");
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg p-1" style={{ background:C.bg2 }}>
          {[["group","By group"],["matchday","By match day"]].map(([k,l])=>(
            <button key={k} onClick={()=>setMode(k)} className="rounded px-3 py-1 text-xs font-bold" style={{ ...up, background:mode===k?C.violet:"transparent", color:mode===k?"#fff":C.mut }}>{l}</button>
          ))}
        </div>
        {mode==="group" && (
          <div className="flex items-center gap-1">
            {["all",...GROUP_KEYS].map(k=>(
              <button key={k} onClick={()=>setSel(k)} className="rounded px-2.5 py-1 text-xs font-bold" style={{ ...up, background:sel===k?C.tile:"transparent", color:sel===k?C.cyan:C.mut2, border:`1px solid ${sel===k?C.line:"transparent"}` }}>{k==="all"?"All":k}</button>
            ))}
          </div>
        )}
      </div>
      {mode==="group" ? (
        <div className="space-y-8">
          {GROUP_KEYS.filter(g=>sel==="all"||sel===g).map(g=>(
            <section key={g}>
              <div className="mb-3 flex items-baseline gap-3">
                <h3 className="text-xl font-bold" style={{ ...up, color:C.cyan }}>Group {g}</h3>
                <span className="text-xs" style={{ color:C.mut2 }}>top 2 advance</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
                <StandingsTable rows={standingsFor(matches,g,asOf)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {matches.filter(m=>m.group===g).map(m=><MatchCard key={m.id} m={m} asOf={asOf} myPick={myPicks[m.id]} setMyPick={setMyPick}/>)}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {[1,2,3].map(md=>(
            <section key={md}>
              <div className="mb-3 flex items-center gap-2">
                <Calendar size={15} style={{color:C.cyan}}/>
                <h3 className="text-lg font-bold" style={{ ...up, color:C.cyan }}>Match day {md}</h3>
                <span className="text-xs" style={{ color:C.mut2 }}>{fmtDay((md-1)*6)} – {fmtDay((md-1)*6+5)}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {matches.filter(m=>m.matchday===md).map(m=><MatchCard key={m.id} m={m} asOf={asOf} myPick={myPicks[m.id]} setMyPick={setMyPick}/>)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* Live qualification picture feeding the bracket (mirrors the FIFA standings page) */
function LiveStandings({ matches, asOf }){
  const data = GROUP_KEYS.map(g=>({ g, rows: standingsFor(matches,g,asOf) }));
  const played = data.some(d=>d.rows.some(r=>r.P>0));
  const thirds = data.map(d=>({ g:d.g, ...d.rows[2] })).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF);
  return (
    <section>
      <div className="mb-1 flex items-center gap-2"><ListOrdered size={16} style={{color:C.cyan}}/><h3 className="text-lg font-bold" style={{ ...up, color:C.cyan }}>Live qualification</h3></div>
      <p className="mb-3 text-xs" style={{ color:C.mut2 }}>Top 2 of each group plus the 8 best third-placed teams reach the Round of 32.</p>
      {!played ? (
        <div className="rounded-lg p-5 text-sm" style={{ background:C.bg2, border:`1px solid ${C.lineSoft}`, color:C.mut }}>
          Positions appear as results come in. Nothing decided yet — the group stage opens {fmtDay(0)}.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_minmax(280px,360px)]">
          {/* group qualifying positions */}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {data.map(({g,rows})=>(
              <div key={g} className="rounded-lg p-2.5" style={{ background:C.bg2, border:`1px solid ${C.lineSoft}` }}>
                <div className="mb-1.5 text-[11px]" style={{ ...up, color:C.mut2 }}>Group {g}</div>
                {[0,1].map(i=>(
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="w-3 text-center text-[11px]" style={{ fontFamily:fDisp,fontWeight:700,color:C.cyan }}>{i+1}</span>
                    <Flag code={rows[i].team[1]} size={13}/>
                    <span className="truncate text-xs" style={{ ...up, fontWeight:600 }}>{rows[i].team[0]}</span>
                    <span className="ml-auto text-xs" style={{ fontFamily:fDisp,fontWeight:700,color:C.text }}>{rows[i].Pts}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* third-place race */}
          <div className="overflow-hidden rounded-lg self-start" style={{ border:`1px solid ${C.lineSoft}` }}>
            <div className="px-3 py-2 text-[11px]" style={{ ...up, color:C.lime, background:C.bg }}>Best third-placed teams</div>
            {thirds.map((t,i)=>{const adv=i<8;return(
              <div key={t.g} className="grid items-center px-3 py-1.5 text-xs" style={{ gridTemplateColumns:"18px 22px 1fr 26px 30px", background:C.bg2, borderTop:`1px solid ${C.bg}`, opacity:adv?1:.45, boxShadow:adv?`inset 3px 0 0 ${C.lime}`:"none" }}>
                <span style={{ fontFamily:fDisp,fontWeight:700,color:adv?C.lime:C.mut2 }}>{i+1}</span>
                <span style={{ ...up, color:C.mut2 }}>{t.g}</span>
                <span className="flex items-center gap-2 truncate"><Flag code={t.team[1]} size={12}/><span className="truncate" style={{ ...up, fontWeight:600 }}>{t.team[0]}</span></span>
                <span className="text-center" style={{ fontFamily:fDisp,color:C.mut }}>{t.GD>0?`+${t.GD}`:t.GD}</span>
                <span className="text-center" style={{ fontFamily:fDisp,fontWeight:700,color:C.text }}>{t.Pts}</span>
              </div>
            );})}
          </div>
        </div>
      )}
    </section>
  );
}

const PARTICLES = Array.from({length:18},(_,i)=>({ left:6+(i*5.1)%88, delay:((i*0.31)%2.6).toFixed(2), dur:(2.2+(i%5)*0.35).toFixed(2), size:2+(i%3) }));

function BkCell({ tie, dim }){
  return (
    <div className="bk-cell" style={{ opacity:dim?0.92:1 }}>
      <span className="bk-team">{tie[0]}</span>
      <span className="bk-team">{tie[1]}</span>
    </div>
  );
}
function BkCol({ ties, side, label, date }){
  return (
    <div className="bk-colwrap">
      <div className="bk-head">{label}{date && <small>{date}</small>}</div>
      <div className={`bk-col bk-${side}`}>
        {ties.map((t,i)=><div key={i} className="bk-slot"><BkCell tie={t}/></div>)}
      </div>
    </div>
  );
}

function Knockout({ matches, asOf }){
  const R = KNOCKOUT;
  const half = a => [a.slice(0,a.length/2), a.slice(a.length/2)];
  const [r32L,r32R]=half(R[0].ties), [r16L,r16R]=half(R[1].ties), [qfL,qfR]=half(R[2].ties), [sfL,sfR]=half(R[3].ties);
  const fin=R[4].ties[0];
  return (
    <div className="space-y-10">
      <LiveStandings matches={matches} asOf={asOf}/>
      <section>
        <div className="mb-1 flex items-center gap-2"><Swords size={16} style={{color:C.cyan}}/><h3 className="text-lg font-bold" style={{ ...up, color:C.cyan }}>Knockout bracket</h3></div>
        <p className="mb-4 text-xs" style={{ color:C.mut2 }}>Fills in as groups finish — slots show the seeding that feeds each tie.</p>
        <div className="overflow-x-auto pb-4">
          <div className="bk-wrap">
            <BkCol side="left"  label="R32" date={R[0].date} ties={r32L}/>
            <BkCol side="left"  label="R16" date={R[1].date} ties={r16L}/>
            <BkCol side="left"  label="QF"  date={R[2].date} ties={qfL}/>
            <BkCol side="left"  label="SF"  date={R[3].date} ties={sfL}/>
            <div className="bk-colwrap">
              <div className="bk-head" style={{ color:C.gold }}>Final<small>{R[4].date}</small></div>
              <div className="bk-center">
                <div className="trophy-wrap">
                  <div className="trophy-glow"/>
                  {PARTICLES.map((p,i)=><span key={i} className="particle" style={{ left:`${p.left}%`, width:p.size, height:p.size, animationDelay:`${p.delay}s`, animationDuration:`${p.dur}s` }}/>)}
                  <Trophy size={54} style={{ color:C.gold, position:"relative", zIndex:2, filter:"drop-shadow(0 3px 10px rgba(232,184,75,.6))" }}/>
                </div>
                <div className="bk-cell bk-final"><span className="bk-team">{fin[0]}</span><span className="bk-team">{fin[1]}</span></div>
              </div>
            </div>
            <BkCol side="right" label="SF"  date={R[3].date} ties={sfR}/>
            <BkCol side="right" label="QF"  date={R[2].date} ties={qfR}/>
            <BkCol side="right" label="R16" date={R[1].date} ties={r16R}/>
            <BkCol side="right" label="R32" date={R[0].date} ties={r32R}/>
          </div>
        </div>
      </section>
    </div>
  );
}

function leaderboard(matches,asOf){
  const acc={}; PEOPLE.forEach(p=>acc[p.id]={p,total:0,exact:0,result:0,miss:0,played:0});
  matches.filter(m=>statusOf(m,asOf)==="finished").forEach(m=>PEOPLE.forEach(p=>{
    const pr=m.preds[p.id],pts=scorePts(pr.h,pr.a,m.actual.h,m.actual.a),a=acc[p.id];
    a.total+=pts;a.played++;if(pts===5)a.exact++;else if(pts===3)a.result++;else a.miss++;
  }));
  return Object.values(acc).sort((x,y)=>y.total-x.total);
}
function progressData(matches,asOf){
  const rounds=[{k:"start",l:"Start"},{k:1,l:"MD1"},{k:2,l:"MD2"},{k:3,l:"MD3"},{k:"r32",l:"R32"},{k:"r16",l:"R16"},{k:"qf",l:"QF"},{k:"sf",l:"SF"},{k:"final",l:"Final"}];
  const run={}; PEOPLE.forEach(p=>run[p.id]=0);
  let stopped=false;
  return rounds.map(rd=>{
    const row={label:rd.l};
    if(rd.k==="start"){PEOPLE.forEach(p=>row[p.id]=0);return row;}
    if(!stopped && typeof rd.k==="number"){
      const ms=matches.filter(m=>m.matchday===rd.k&&statusOf(m,asOf)==="finished");
      if(ms.length===0){ stopped=true; return row; } // future round → leave blank, line stops
      ms.forEach(m=>PEOPLE.forEach(p=>{const pr=m.preds[p.id];run[p.id]+=scorePts(pr.h,pr.a,m.actual.h,m.actual.a);}));
      PEOPLE.forEach(p=>row[p.id]=run[p.id]);
    }
    return row;
  });
}
function Standings({ matches, asOf }){
  const rows=useMemo(()=>leaderboard(matches,asOf),[matches,asOf]);
  const data=useMemo(()=>progressData(matches,asOf),[matches,asOf]);
  const leader=rows[0];
  const anyPlayed=leader.played>0;
  if(!anyPlayed) return (
    <div className="rounded-xl p-8 text-center" style={{ background:C.bg2, border:`1px solid ${C.lineSoft}` }}>
      <Trophy size={28} style={{ color:C.mut2 }} className="mx-auto"/>
      <h3 className="mt-3 text-lg font-bold" style={{ ...up, color:C.cyan }}>No results yet</h3>
      <p className="mt-1 text-sm" style={{ color:C.mut }}>The table fills once the first matches finish. Group stage kicks off {fmtDay(0)} with Mexico v South Africa.</p>
    </div>
  );
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center gap-2"><Trophy size={18} style={{color:C.lime}}/><h3 className="text-xl font-bold" style={{ ...up, color:C.cyan }}>Overall standings</h3></div>
        <div className="space-y-2">
          {rows.map((r,i)=>(
            <div key={r.p.id} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background:C.bg2, border:`1px solid ${i===0?C.violet:C.lineSoft}`, boxShadow:i===0?`inset 4px 0 0 ${C.lime}`:"none" }}>
              <span className="w-5 text-center" style={{ fontFamily:fDisp,fontWeight:700,fontSize:20,color:i===0?C.lime:C.mut2 }}>{i+1}</span>
              <Avatar p={r.p} size={34}/>
              <div className="min-w-0">
                <div className="font-bold" style={{ ...up }}>{r.p.name}{r.p.id==="you"&&<span style={{color:C.mut2}}> · me</span>}</div>
                <div className="text-[11px]" style={{ color:C.mut2 }}>{r.exact} exact · {r.result} results · {r.miss} missed</div>
              </div>
              <div className="ml-auto text-right">
                <div style={{ fontFamily:fDisp,fontWeight:700,fontSize:26,lineHeight:1,color:i===0?C.lime:C.text }}>{r.total}</div>
                <div className="text-[10px]" style={{ ...up, color:C.mut2 }}>points</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color:C.mut2 }}>{leader.p.name} {leader.p.id==="you"?"are":"is"} topping the table after {leader.played} games each.</p>
      </section>
      <section>
        <div className="mb-3 flex items-center gap-2"><Users size={16} style={{color:C.cyan}}/><h3 className="text-lg font-bold" style={{ ...up, color:C.cyan }}>Points by round</h3></div>
        <div className="rounded-lg p-3" style={{ background:C.bg2, border:`1px solid ${C.lineSoft}`, height:300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top:8,right:12,bottom:4,left:-18 }}>
              <CartesianGrid stroke={C.lineSoft} strokeDasharray="2 4" vertical={false}/>
              <XAxis dataKey="label" stroke={C.mut2} tick={{ fontSize:11, fill:C.mut2 }} tickLine={false} axisLine={{stroke:C.line}}/>
              <YAxis stroke={C.mut2} tick={{ fontSize:11, fill:C.mut2 }} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{ background:C.bg, border:`1px solid ${C.line}`, borderRadius:8, color:C.text }} labelStyle={{ color:C.mut }}/>
              {PEOPLE.map(p=><Line key={p.id} type="monotone" dataKey={p.id} name={p.name} stroke={p.color} strokeWidth={2.5} dot={{ r:3, fill:p.color }} connectNulls={false}/>)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          {PEOPLE.map(p=><span key={p.id} className="inline-flex items-center gap-1.5 text-xs" style={{ color:C.mut }}><span className="h-2.5 w-2.5 rounded-full" style={{ background:p.color }}/>{p.name}</span>)}
        </div>
      </section>
    </div>
  );
}

function Rules(){
  const rows=[["Exact score","Predicted score equals the final score","+5",C.lime],
    ["Right result","Correct winner or draw, wrong score","+3",C.cyan],
    ["Miss","Wrong outcome","+0",C.mut2]];
  return (
    <div className="max-w-2xl space-y-4">
      <h3 className="text-xl font-bold" style={{ ...up, color:C.cyan }}>How scoring works</h3>
      <p className="text-sm" style={{ color:C.mut }}>Lock a scoreline before kickoff. Picks stay hidden until the final whistle, then everyone's call is revealed and points land automatically.</p>
      <div className="space-y-2">
        {rows.map(([t,d,p,col])=>(
          <div key={t} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background:C.bg2, border:`1px solid ${C.lineSoft}` }}>
            <span className="grid place-items-center rounded" style={{ ...up, fontWeight:700, width:48,height:34,background:col,color:"#0A0C26" }}>{p}</span>
            <div><div className="font-bold" style={{ ...up }}>{t}</div><div className="text-xs" style={{ color:C.mut2 }}>{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Home — FIFA tile menu
 * ------------------------------------------------------------------ */
function Tile({ label, icon:Icon, sub, onClick, featured, accent=C.cyan, children }) {
  return (
    <button onClick={onClick} className={`tile group text-left ${featured?"featured":""}`}
      style={{ minHeight:featured?180:140 }}>
      <div className="relative z-10 flex h-full flex-col p-4">
        <span className="lab text-lg font-bold leading-tight" style={{ ...up }}>{label}</span>
        {sub && <span className="mt-1 text-xs" style={{ color:C.mut }}>{sub}</span>}
        <div className="mt-auto">{children}</div>
      </div>
      <Icon className="tile-icon" size={featured?96:64} style={{ color:accent }}/>
    </button>
  );
}

function Home({ go, matches, asOf }){
  const upcoming = matches.filter(m=>statusOf(m,asOf)!=="finished").sort((a,b)=>a.day-b.day);
  const next = upcoming[0];
  const liveToday = matches.some(m=>statusOf(m,asOf)==="today");
  return (
    <div className="space-y-5">
      {/* Hero band — FIFA 22 "Primary News" */}
      <div className="hero relative overflow-hidden rounded-xl p-6 sm:p-8">
        <div className="relative z-10 max-w-lg">
          <span className="text-xs font-bold" style={{ ...up, color:C.cyan }}>{liveToday?"Match day in progress":"Predictions open"}</span>
          <h2 className="mt-1 text-3xl sm:text-4xl font-bold leading-none" style={{ ...up }}>Lock your<br/>predictions</h2>
          <p className="mt-2 text-sm" style={{ color:C.mut }}>
            {next ? <>Next up: {next.home[0]} v {next.away[0]} · {fmtDay(next.day)}. Picks lock at kickoff, hidden from the others until full time.</>
                  : <>Group stage complete — on to the knockouts.</>}
          </p>
          <button onClick={()=>go("groups")} className="mt-4 rounded-lg px-5 py-2 text-sm font-bold" style={{ ...up, background:C.lime, color:"#0A0C26" }}>Make picks →</button>
        </div>
        <span className="hero-num">26</span>
      </div>

      {/* Tile grid — FIFA 21 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile featured label="Predict" icon={Target} accent={C.lime} sub="Open fixtures" onClick={()=>go("groups")}>
          {next && <div className="mt-3 flex items-center gap-2 text-sm font-semibold" style={{ ...up, color:C.cyan }}>
            <Flag code={next.home[1]} size={15}/><span style={{color:C.mut2}}>v</span><Flag code={next.away[1]} size={15}/>
            <span className="text-[11px]" style={{color:C.mut2}}>up next</span>
          </div>}
        </Tile>
        <Tile label="Group stage" icon={ListOrdered} sub="Tables & fixtures" onClick={()=>go("groups")}/>
        <Tile label="Knockout" icon={Swords} sub="The road to the final" onClick={()=>go("bracket")}/>
        <Tile label="Standings" icon={Trophy} accent={C.lime} sub="Who's winning the pool" onClick={()=>go("standings")}/>
        <Tile label="Next match" icon={Calendar} sub={next?`${next.home[0]} v ${next.away[0]} · ${fmtDay(next.day)}`:"—"} onClick={()=>go("groups")}>
          {next && <div className="mt-3 flex items-center justify-between">
            <Flag code={next.home[1]} size={22}/><span className="text-sm" style={{ ...up, color:C.mut2 }}>vs</span><Flag code={next.away[1]} size={22}/>
          </div>}
        </Tile>
        <Tile label="Progress" icon={TrendingUp} sub="Points by round" onClick={()=>go("standings")}/>
        <Tile label="My picks" icon={Users} sub="Review your calls" onClick={()=>go("groups")}/>
        <Tile label="How it works" icon={BookOpen} accent={C.magenta} sub="5 / 3 / 0 scoring" onClick={()=>go("rules")}/>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Shell
 * ------------------------------------------------------------------ */
const TABS = [["home","Home"],["groups","Group stage"],["bracket","Knockout"],["standings","Standings"],["rules","Rules"]];
const CRUMB = { home:"Home", groups:"Group stage", bracket:"Knockout", standings:"Standings", rules:"Rules" };

export default function App(){
  const matches=useMemo(()=>buildMatches(),[]);
  const [tab,setTab]=useState("home");
  const [asOf,setAsOf]=useState(0); // day index from Jun 11 2026 (real "today")
  const [myPicks,setMyPicks]=useState(()=>{const o={};matches.forEach(m=>o[m.id]={...m.preds.you});return o;});
  const setMyPick=(id,v)=>setMyPicks(s=>({...s,[id]:v}));
  const go=setTab;
  const liveToday=matches.some(m=>statusOf(m,asOf)==="today");
  const started=matches.some(m=>statusOf(m,asOf)==="finished");

  return (
    <div style={{ background:C.bg, color:C.text, minHeight:"100vh", fontFamily:fBody }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Rajdhani:wght@500;600;700&display=swap');
        .app-bg{ position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(900px 500px at 12% -5%, rgba(236,44,142,.20), transparent 55%),
            radial-gradient(900px 600px at 88% 0%, rgba(139,92,246,.22), transparent 55%),
            radial-gradient(700px 500px at 50% 110%, rgba(34,224,222,.10), transparent 60%); }
        .navbtn{ color:${C.mut}; padding:.4rem .85rem; border-radius:8px; font-family:${fDisp}; font-weight:600; letter-spacing:.07em; text-transform:uppercase; font-size:13px; }
        .navbtn:hover{ color:${C.text}; }
        .navbtn.active{ background:linear-gradient(135deg, ${C.violet}, ${C.violet2}); color:#fff; }
        .tile{ position:relative; background:rgba(22,26,71,.78); border:1px solid ${C.lineSoft}; border-radius:12px; overflow:hidden; cursor:pointer;
          transition:transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease; }
        .tile:hover, .tile:focus-visible{ background:linear-gradient(135deg, ${C.violet2}, #3E2399); border-color:${C.violet}; transform:translateY(-3px); box-shadow:0 14px 34px -10px rgba(139,92,246,.65); outline:none; }
        .tile::before{ content:""; position:absolute; left:0; top:0; bottom:0; width:0; background:${C.orange}; transition:width .15s ease; }
        .tile:hover::before, .tile:focus-visible::before{ width:4px; }
        .tile-icon{ position:absolute; right:-10px; bottom:-14px; opacity:.14; }
        .tile.featured{ background:rgba(20,30,80,.85); }
        .hero{ border:1px solid ${C.lineSoft};
          background:linear-gradient(120deg, rgba(17,20,58,.95) 30%, rgba(60,20,90,.7) 75%, rgba(236,44,142,.35)); }
        .hero-num{ position:absolute; right:-8px; top:-40px; font-family:${fDisp}; font-weight:700; font-size:240px; line-height:1; color:rgba(34,224,222,.10); }

        /* ---- bracket ---- */
        .bk-wrap{ display:flex; align-items:stretch; gap:14px; min-width:1180px; }
        .bk-colwrap{ display:flex; flex-direction:column; align-items:center; }
        .bk-head{ height:30px; display:flex; align-items:center; gap:6px; font-family:${fDisp}; font-weight:700; text-transform:uppercase; letter-spacing:.08em; font-size:12px; color:${C.cyan}; }
        .bk-head small{ color:${C.mut2}; font-weight:600; letter-spacing:.02em; }
        .bk-col{ display:flex; flex-direction:column; height:600px; }
        .bk-slot{ flex:1; display:flex; align-items:center; position:relative; }
        .bk-cell{ width:128px; background:${C.bg2}; border:1px solid ${C.lineSoft}; border-radius:8px; padding:6px 9px; display:flex; flex-direction:column; gap:4px; }
        .bk-team{ font-family:${fDisp}; font-weight:600; text-transform:uppercase; letter-spacing:.03em; font-size:11px; line-height:1.2; color:${C.mut}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bk-team + .bk-team{ border-top:1px solid ${C.bg}; padding-top:4px; }
        .bk-final{ width:150px; border-color:${C.gold}; box-shadow:0 0 22px -6px rgba(232,184,75,.55); }
        .bk-final .bk-team{ color:${C.text}; }
        /* connectors */
        .bk-left  .bk-slot::after{ content:''; position:absolute; right:-14px; top:50%; width:14px; height:2px; background:${C.line}; }
        .bk-right .bk-slot::after{ content:''; position:absolute; left:-14px;  top:50%; width:14px; height:2px; background:${C.line}; }
        .bk-left  .bk-slot:nth-child(odd):not(:last-child)::before{ content:''; position:absolute; right:-14px; top:50%; height:100%; width:2px; background:${C.line}; }
        .bk-right .bk-slot:nth-child(odd):not(:last-child)::before{ content:''; position:absolute; left:-14px;  top:50%; height:100%; width:2px; background:${C.line}; }
        .bk-center{ height:600px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; }

        /* ---- trophy + particles ---- */
        .trophy-wrap{ position:relative; display:grid; place-items:center; width:120px; height:120px; }
        .trophy-glow{ position:absolute; inset:8px; border-radius:50%; background:radial-gradient(circle, rgba(232,184,75,.40), transparent 62%); filter:blur(3px); }
        .particle{ position:absolute; bottom:34%; border-radius:50%; background:${C.gold}; opacity:0; box-shadow:0 0 6px ${C.gold}; animation:rise linear infinite; }
        @keyframes rise{ 0%{ transform:translateY(6px) scale(.5); opacity:0; } 18%{ opacity:1; } 100%{ transform:translateY(-52px) scale(1); opacity:0; } }

        @media (prefers-reduced-motion: reduce){ .tile{ transition:none; } .tile:hover{ transform:none; } .particle{ animation:none; opacity:.6; } }
      `}</style>
      <div className="app-bg"/>

      <div className="relative" style={{ zIndex:1 }}>
        {/* status strip + date scrubber */}
        <div className="border-b" style={{ borderColor:C.lineSoft, background:"rgba(10,12,38,.7)" }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-[11px]" style={{ ...up, color:C.mut2 }}>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background:liveToday?C.magenta:started?C.lime:C.mut2 }}/>
              {liveToday?"Live":started?"Underway":"Kicks off Jun 11"} · World Cup 2026
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span style={{ color:C.mut2 }}>Viewing</span>
              <button onClick={()=>setAsOf(d=>Math.max(0,d-1))} disabled={asOf===0} className="grid place-items-center rounded" style={{ width:20,height:20,background:C.tile,color:asOf===0?C.mut2:C.cyan,opacity:asOf===0?.4:1 }}>‹</button>
              <span style={{ color:C.cyan, minWidth:48, textAlign:"center" }}>{fmtDay(asOf)}</span>
              <button onClick={()=>setAsOf(d=>Math.min(40,d+1))} className="grid place-items-center rounded" style={{ width:20,height:20,background:C.tile,color:C.cyan }}>›</button>
              {asOf!==0 && <button onClick={()=>setAsOf(0)} className="rounded px-1.5 py-0.5" style={{ color:C.magenta }}>Today</button>}
            </div>
            <span style={{ color:C.cyan }}>@you</span>
          </div>
        </div>

        {/* nav */}
        <header className="sticky top-0 z-20 border-b backdrop-blur" style={{ borderColor:C.lineSoft, background:"rgba(10,12,38,.82)" }}>
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <button onClick={()=>go("home")} className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded text-sm" style={{ background:C.lime, color:"#0A0C26" }}>⚽</span>
              <span className="text-base font-bold" style={{ ...up }}>The Pool</span>
            </button>
            <nav className="ml-auto flex items-center gap-1">
              {TABS.map(([k,l])=><button key={k} onClick={()=>go(k)} className={`navbtn ${tab===k?"active":""}`}>{l}</button>)}
            </nav>
          </div>
        </header>

        {/* breadcrumb */}
        {tab!=="home" && (
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <div className="flex items-center gap-1.5 text-xs" style={{ ...up, color:C.mut2 }}>
              <button onClick={()=>go("home")} className="hover:text-cyan-300">Home</button>
              <ChevronRight size={13}/><span style={{ color:C.cyan }}>{CRUMB[tab]}</span>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-6">
          {tab==="home" && <Home go={go} matches={matches} asOf={asOf}/>}
          {tab==="groups" && <GroupStage matches={matches} asOf={asOf} myPicks={myPicks} setMyPick={setMyPick}/>}
          {tab==="bracket" && <Knockout matches={matches} asOf={asOf}/>}
          {tab==="standings" && <Standings matches={matches} asOf={asOf}/>}
          {tab==="rules" && <Rules/>}
        </main>

        {/* controller hint footer */}
        <footer className="sticky bottom-0 border-t backdrop-blur" style={{ borderColor:C.lineSoft, background:"rgba(10,12,38,.82)" }}>
          <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-2 text-[11px]" style={{ ...up, color:C.mut }}>
            <span className="flex items-center gap-1.5"><Glyph c="#3B82F6">✕</Glyph> Select</span>
            <span className="flex items-center gap-1.5"><Glyph c="#EF4444">◯</Glyph> Back</span>
            <span className="flex items-center gap-1.5"><Glyph c="#22C55E">△</Glyph> Standings</span>
            <span className="ml-auto" style={{ color:C.mut2 }}>Official draw · simulated results — scrub the date to advance</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Glyph({ c, children }){
  return <span className="grid place-items-center rounded-full text-[10px]" style={{ width:16,height:16,border:`1.5px solid ${c}`,color:c }}>{children}</span>;
}
