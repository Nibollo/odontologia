import React, { useEffect, useState } from "react";
import "./odontogram.css";
import { 
  initOdontogram, 
  destroyOdontogram, 
  getFullStatus,
  hydrateState,
  setNumberingSystem,
  setReadOnly,
  setNotesEnabled,
  registerPlugins,
  setChangeCallback,
  setOcclusalVisible,
  setWisdomVisible,
  setShowBase,
  setHealthyPulpVisible,
  type NumberingSystem,
  type OdontogramPlugin
} from "./odontogram";
import { useI18n } from "./i18n/useI18n";
import type { Language } from "./i18n/translations";

// Assets
const iconOcclUrl = "/assets/icon-svgs/icon_occl.svg";
const icon8Url = "/assets/icon-svgs/icon_8.svg";
const iconGumUrl = "/assets/icon-svgs/icon_gum.svg";
const iconPulpUrl = "/assets/icon-svgs/icon_pulp.svg";
const iconNoSelectionUrl = "/assets/icon-svgs/icon_no_selection.svg";

interface AppProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  numberingSystem?: NumberingSystem;
  onNumberingChange?: (sys: NumberingSystem) => void;
  darkMode?: boolean;
  onDarkModeChange?: (isDark: boolean) => void;
  plugins?: OdontogramPlugin[];
  readOnly?: boolean;
  enableNotes?: boolean;
}

export default function App({
  language,
  onLanguageChange,
  numberingSystem,
  plugins,
  readOnly: readOnlyProp,
  enableNotes,
}: AppProps) {
  const { t } = useI18n({ language, onLanguageChange });
  const currentNumbering = numberingSystem ?? "FDI";

  // Toggle visibility state (mirrors engine globals)
  const [occlusal, setOcclusal] = useState(true);
  const [wisdom, setWisdom] = useState(true);
  const [bone, setBone] = useState(true);
  const [pulp, setPulp] = useState(true);

  useEffect(() => {
    initOdontogram();
    return () => {
      destroyOdontogram();
    };
  }, []);

  useEffect(() => {
    setNumberingSystem(currentNumbering);
  }, [currentNumbering]);

  useEffect(() => {
    registerPlugins(plugins ?? []);
  }, [plugins]);

  useEffect(() => {
    setReadOnly(readOnlyProp ?? false);
  }, [readOnlyProp]);

  useEffect(() => {
    setNotesEnabled(enableNotes ?? false);
  }, [enableNotes]);

  function handleToggleOcclusal() {
    const next = !occlusal;
    setOcclusal(next);
    setOcclusalVisible(next);
  }

  function handleToggleWisdom() {
    const next = !wisdom;
    setWisdom(next);
    setWisdomVisible(next);
  }

  function handleToggleBone() {
    const next = !bone;
    setBone(next);
    setShowBase(next);
  }

  function handleTogglePulp() {
    const next = !pulp;
    setPulp(next);
    setHealthyPulpVisible(next);
  }

  return (
    <div className="odontogram-root">
      <main className="odon-layout">
        <aside className="odon-panel odon-panel-top">
          <div className="odon-panel-header">
            <div className="odon-panel-title-row">
              <span className="odon-panel-title">{t("panel.controls")}</span>
              <div className="odon-panel-title-actions">
                <button id="btnSelectNone" className="odon-btn odon-btn-ghost odon-btn-sm btn-danger">{t("panel.clearSelection")}</button>
                <button id="btnToggleControlsCard" className="odon-icon-btn">
                  <span className="toggle-icon">−</span>
                </button>
              </div>
            </div>
            <div className="odon-panel-subtitle">{t("panel.activeTooth")}: <span id="activeToothLabel" className="odon-pill">{t("selection.none")}</span></div>
            
            <div id="controlsActions" className="odon-select-actions">
               <div className="odon-select-actions-row">
                  <button id="btnSelectAll" className="odon-btn odon-btn-ghost odon-btn-sm">{t("panel.selectActions.all")}</button>
                  <button id="btnSelectPermanent" className="odon-btn odon-btn-ghost odon-btn-sm">{t("panel.selectActions.permanent")}</button>
                  <button id="btnSelectMilk" className="odon-btn odon-btn-ghost odon-btn-sm">{t("panel.selectActions.milk")}</button>
                  <button id="btnSelectAllPresent" className="hidden"></button>
                  <button id="btnSelectImplants" className="hidden"></button>
                  <button id="btnSelectAllMissing" className="hidden"></button>
               </div>
               <div className="odon-select-actions-row">
                  <button id="btnSelectUpper" className="odon-btn odon-btn-ghost odon-btn-sm">{t("panel.selectActions.upper")}</button>
                  <button id="btnSelectLower" className="odon-btn odon-btn-ghost odon-btn-sm">{t("panel.selectActions.lower")}</button>
                  <button id="btnSelectUpperFront" className="hidden"></button>
                  <button id="btnSelectUpperMolar" className="hidden"></button>
                  <button id="btnSelectLowerFront" className="hidden"></button>
                  <button id="btnSelectLowerMolar" className="hidden"></button>
               </div>
            </div>
            <div id="warnings" className="odon-warnings"></div>
          </div>

          <div className="odon-panel-body">
            {/* Status Section */}
            <section id="statusCard" className="odon-card">
              <div className="odon-card-title-row">
                <div className="odon-card-title">{t("status.title")}</div>
                <button id="btnToggleStatusCard" className="odon-icon-btn"><span className="toggle-icon">−</span></button>
              </div>
              <div id="statusCardBody" className="odon-row odon-status-actions">
                <button id="btnResetAll" className="odon-btn odon-btn-ghost odon-btn-sm">{t("status.resetAll")}</button>
                <button id="btnPrimaryDentition" className="odon-btn odon-btn-ghost odon-btn-sm">{t("status.primaryDentition")}</button>
                <button id="btnMixedDentition" className="odon-btn odon-btn-ghost odon-btn-sm">{t("status.mixedDentition")}</button>
                <button id="btnEdentulous" className="hidden"></button>
              </div>
              <div className="odon-status-extra-row odon-row">
                 <select id="statusExtraSelect" className="odon-select"></select>
                 <button id="statusExtraApply" className="odon-btn odon-btn-ghost odon-btn-sm">{t("status.extraApply")}</button>
              </div>
            </section>

            {/* Tooth Details Section */}
            <section className="odon-card">
              <div className="odon-card-title-row">
                <div className="odon-card-title">{t("tooth.title")}</div>
                <button id="btnResetTooth" className="odon-btn odon-btn-ghost odon-btn-sm">{t("tooth.reset")}</button>
              </div>
              <div className="odon-row">
                <span>{t("tooth.baseLabel")}</span>
                <select id="toothSelect" className="odon-select"></select>
              </div>
              <div id="bridgeUnitRow" className="odon-row">
                <span>{t("tooth.bridgeLabel")}</span>
                <select id="bridgeUnitSelect" className="odon-select"></select>
              </div>
              
              <div className="odon-check-grid">
                <label id="extractionRow" className="odon-check-label">
                  <input type="checkbox" id="extractionWound" />
                  <span>{t("tooth.extractionWound")}</span>
                </label>
                <label id="missingClosedRow" className="odon-check-label">
                  <input type="checkbox" id="missingClosed" />
                  <span>{t("tooth.missingClosed")}</span>
                </label>
              </div>

              <div id="crownRow" className="odon-row">
                <span>{t("tooth.crownLabel")}</span>
                <select id="crownSelect" className="odon-select"></select>
              </div>

              <div id="brokenCrownRow" className="odon-check-grid">
                  <label><input type="checkbox" id="brokenMesial" /><span>{t("tooth.broken.mesial")}</span></label>
                  <label><input type="checkbox" id="brokenIncisal" /><span>{t("tooth.broken.incisal")}</span></label>
                  <label><input type="checkbox" id="brokenDistal" /><span>{t("tooth.broken.distal")}</span></label>
              </div>
            </section>

            <section id="cariesSection" className="odon-card">
              <div className="odon-card-title-row">
                <div className="odon-card-title">{t("caries.title")}</div>
                <button id="btnToggleCariesCard" className="odon-icon-btn"><span className="toggle-icon">−</span></button>
              </div>
              <div id="cariesChecks" className="odon-check-grid"></div>
            </section>

            <section id="fillingSection" className="odon-card">
              <div className="odon-card-title-row">
                <div className="odon-card-title">{t("filling.title")}</div>
                <button id="btnToggleFillingCard" className="odon-icon-btn"><span className="toggle-icon">−</span></button>
              </div>
              <div className="odon-row">
                <span>{t("filling.typeLabel")}</span>
                <select id="fillingSelect" className="odon-select"></select>
              </div>
              <div id="fillingSurfaceChecks" className="odon-check-grid odon-mt-2"></div>
              <label className="odon-check-label odon-mt-2">
                 <input type="checkbox" id="fissureSealing" />
                 <span>{t("filling.fissureSealing")}</span>
              </label>
            </section>

            <section id="endoSection" className="odon-card">
              <div className="odon-card-title-row">
                <div className="odon-card-title">{t("endo.title")}</div>
                <button id="btnToggleEndoCard" className="odon-icon-btn"><span className="toggle-icon">−</span></button>
              </div>
              <select id="endoSelect" className="odon-select"></select>
              <div id="endoAuxRow" className="odon-check-grid odon-mt-2">
                <label className="odon-check-label"><input type="checkbox" id="pulpInflam" /><span>{t("endo.pulpitis")}</span></label>
                <label className="odon-check-label"><input type="checkbox" id="endoResection" /><span>{t("endo.resection")}</span></label>
                <label className="odon-check-label"><input type="checkbox" id="parapulpalPin" /><span>{t("endo.parapulpalPin")}</span></label>
              </div>
            </section>

            <section id="inflammationSection" className="odon-card">
              <div className="odon-card-title-row">
                <div className="odon-card-title">{t("inflammation.title")}</div>
                <button id="btnToggleInflammationCard" className="odon-icon-btn"><span className="toggle-icon">−</span></button>
              </div>
              <div id="modsChecks" className="odon-check-grid"></div>
              <div className="odon-row odon-mt-2">
                <span>{t("mobility.title")}</span>
                <select id="mobilitySelect" className="odon-select"></select>
              </div>
            </section>

            {/* Hidden Required IDs for compatibility */}
            <div className="hidden">
              <div id="extractionPlanRow"></div>
              <div id="missingClosedRow"></div>
              <div id="bridgeUnitRow"></div>
              <div id="crownRow"></div>
              <div id="mobilityRow"></div>
              <div id="brokenCrownRow"></div>
              <div id="extractionRow"></div>
              <div id="contactPointRow"></div>
              <div id="bruxismRow"></div>
              <div id="fissureSealingRow"></div>
              <div id="bridgePillarRow"></div>
              <div id="lbl-parodontal"></div>
              <div id="lbl-inflammation"></div>
              <input type="checkbox" id="chk-parodontal" />
              <input type="checkbox" id="chk-inflammation" />

              <div id="crownActionsRow"></div>
              <div id="crownReplaceRow"></div>
              <div id="crownNeededRow"></div>
              <div id="fissureCompatRow"></div>
              <div id="hiddenCheckboxes">
                <input type="checkbox" id="contactMesial" />
                <input type="checkbox" id="contactDistal" />
                <input type="checkbox" id="brokenMesial" />
                <input type="checkbox" id="brokenIncisal" />
                <input type="checkbox" id="brokenDistal" />
                <input type="checkbox" id="extractionWound" />
                <input type="checkbox" id="missingClosed" />
                <input type="checkbox" id="extractionPlan" />
                <input type="checkbox" id="bridgePillar" />
                <input type="checkbox" id="crownReplace" />
                <input type="checkbox" id="crownNeeded" />
              </div>
              <select id="bridgeUnitSelect"></select>
              <div id="rootCanalSection"><div id="rootCanalGrid"></div></div>
              <div id="fissureSection"><div id="fissureGrid"></div></div>
            </div>
          </div>
        </aside>

        <section className="odon-chart">
          <div className="odon-chart-header">
            <div>
              <div className="odon-chart-title">{t("chart.title")}</div>
              <div className="odon-chart-hint">{t("chart.hint")}</div>
            </div>
            <div className="odon-chart-actions">
              <button
                id="btnOcclView"
                className="odon-btn odon-btn-toggle odon-btn-icon"
                aria-pressed={occlusal}
                aria-label={t("chart.actions.occlusal")}
                title={t("chart.actions.occlusal")}
                data-icon-src={iconOcclUrl}
                onClick={handleToggleOcclusal}
              >
                <span className="odon-btn-label">{t("chart.actions.occlusal")}</span>
              </button>
              <button
                id="btnWisdomVisible"
                className="odon-btn odon-btn-toggle odon-btn-icon"
                aria-pressed={wisdom}
                aria-label={t("chart.actions.wisdom")}
                title={t("chart.actions.wisdom")}
                data-icon-src={icon8Url}
                onClick={handleToggleWisdom}
              >
                <span className="odon-btn-label">{t("chart.actions.wisdom")}</span>
              </button>
              <button
                id="btnBoneVisible"
                className="odon-btn odon-btn-toggle odon-btn-icon"
                aria-pressed={bone}
                aria-label={t("chart.actions.bone")}
                title={t("chart.actions.bone")}
                data-icon-src={iconGumUrl}
                onClick={handleToggleBone}
              >
                <span className="odon-btn-label">{t("chart.actions.bone")}</span>
              </button>
              <button
                id="btnPulpVisible"
                className="odon-btn odon-btn-toggle odon-btn-icon"
                aria-pressed={pulp}
                aria-label={t("chart.actions.pulp")}
                title={t("chart.actions.pulp")}
                data-icon-src={iconPulpUrl}
                onClick={handleTogglePulp}
              >
                <span className="odon-btn-label">{t("chart.actions.pulp")}</span>
              </button>
              <button
                id="btnSelectNoneChart"
                className="odon-btn odon-btn-ghost odon-btn-icon"
                aria-label={t("chart.actions.clearSelection")}
                title={t("chart.actions.clearSelection")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="icon-img" src={iconNoSelectionUrl} alt="" aria-hidden="true" />
                <span className="odon-btn-label">{t("chart.actions.clearSelection")}</span>
              </button>
              <button 
                className="odon-btn odon-btn-primary odon-ml-2" 
                onClick={() => window.print()}
                title="Generar PDF"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'6px'}}>
                  <path d="M6 9V2h12v7"></path>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <path d="M6 14h12v8H6z"></path>
                </svg>
                <span>PDF</span>
              </button>
            </div>
          </div>
          <div id="toothGrid" className="odon-tooth-grid"></div>
        </section>
      </main>
    </div>
  );
}

export { getFullStatus, hydrateState as setFullStatus, setChangeCallback };
