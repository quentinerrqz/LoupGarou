import { memo, useState } from "react";

const Regles = memo(function Regles() {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className={`absolute right-0 top-0 z-30 `}>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setOpen(!open)}
      >
        i
      </button>
      {open && (
        <div className="absolute right-0 bg-gray-900/30 text-white backdrop-blur-3xl border border-gray-300 p-4 rounded shadow-lg w-64 overflow-auto max-h-96  ">
          <h2 className="text-lg font-bold">Règles du jeu</h2>
          <p>Voici les règles du jeu...</p>
          <ul>
            <li>Chaque joueur reçoit un rôle secret.</li>
            <li>Les villageois doivent identifier les loups-garous.</li>
            <li>Les loups-garous doivent éliminer les villageois.</li>
            <li>
              Les joueurs peuvent discuter et voter pour éliminer un autre
              joueur au cours d'un vote.
            </li>
            <li>
              Le jeu se termine lorsque tous les loups-garous sont éliminés ou
              que les villageois sont en minorité.
            </li>
            <li>Les rôles spéciaux ont des capacités uniques.</li>
            <li>
              Le jeu se joue en plusieurs tours, alternant entre la nuit et le
              jour.
            </li>
            <li>
              Les joueurs doivent utiliser leur stratégie et leur persuasion
              pour gagner.
            </li>
            <li>Le jeu peut être joué avec un nombre variable de joueurs.</li>
            <li>Les règles peuvent varier en fonction des variantes du jeu.</li>
          </ul>
        </div>
      )}
    </div>
  );
});

export default Regles;
