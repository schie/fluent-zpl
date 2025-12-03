// import './App.css'
import { useState } from 'react';
import {
  Label175x075,
  Label181x087,
  Label184x125,
  Label2125x100,
  Label238x175,
  Label267x100,
  Label2874x0669,
  Label300x100,
  Label300x55,
} from './components';

interface ModalContents {
  title: string;
  zpl: string;
}

function App() {
  const [modalContents, setModalContents] = useState<ModalContents | null>(null);

  const onLabelDetailClick = (title: string, zpl: string) => {
    const modal = document.getElementById('my_modal_3') as HTMLDialogElement;
    setModalContents({
      title,
      zpl: zpl
        .split('^')
        .filter((line) => line.trim().length > 0)
        .map((line) => '^' + line)
        .join('\n'),
    });
    modal.showModal();
  };

  return (
    <div className="p-10 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-base-200 px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-wide text-secondary">Fluent ZPL Examples</p>
        </div>
        <div className="flex items-center gap-3">
          <a className="btn btn-outline btn-sm" href="../">
            API Docs
          </a>
          <a className="btn btn-primary btn-sm" href="https://github.com/schie/fluent-zpl">
            GitHub
          </a>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Label175x075 onDetailClick={onLabelDetailClick} />
        <Label300x100 onDetailClick={onLabelDetailClick} />
        <Label300x55 onDetailClick={onLabelDetailClick} />
        <Label238x175 onDetailClick={onLabelDetailClick} />
        <Label2125x100 onDetailClick={onLabelDetailClick} />
        <Label184x125 onDetailClick={onLabelDetailClick} />
        <Label181x087 onDetailClick={onLabelDetailClick} />
        <Label267x100 onDetailClick={onLabelDetailClick} />
        <Label2874x0669 onDetailClick={onLabelDetailClick} />
      </div>
      <dialog id="my_modal_3" className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">{modalContents?.title}</h3>
          <pre className="py-4 overflow-x-auto">
            <code>{modalContents?.zpl}</code>
          </pre>
        </div>
      </dialog>
    </div>
  );
}

export default App;
