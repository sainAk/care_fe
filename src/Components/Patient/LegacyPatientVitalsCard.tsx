import { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { listAssetBeds, getPermittedFacility } from "../../Redux/actions";
import { classNames } from "../../Utils/utils";
import { AssetData } from "../Assets/AssetTypes";
import ToolTip from "../Common/utils/Tooltip";
import { PatientModel } from "./models";
import Waveform, { WaveformType } from "./Waveform";

export interface IPatientVitalsCardProps {
  facilityId?: string;
  patient?: PatientModel;
  socketUrl?: string;
  shrinked?: boolean;
}

const getVital = (
  patientObservations: any,
  vital: string,
  fallbackValue?: any
) => {
  if (patientObservations) {
    const vitalValues = patientObservations[vital];
    if (vitalValues) {
      const returnValue = vitalValues?.value;

      if (returnValue !== undefined && returnValue !== null) {
        return returnValue;
      }
    }
  }
  if (fallbackValue) {
    return fallbackValue;
  }
  return "";
};

export default function LegacyPatientVitalsCard({
  patient,
  socketUrl,
  facilityId,
  shrinked,
}: IPatientVitalsCardProps) {
  const wsClient = useRef<WebSocket>();
  const [waveforms, setWaveForms] = useState<WaveformType[] | null>(null);
  const dispatch: any = useDispatch();
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [patientObservations, setPatientObservations] = useState<any>();
  const [stats, setStats] = useState(false);

  useEffect(() => {
    const fetchFacility = async () => {
      const res = await dispatch(getPermittedFacility(facilityId || ""));

      if (res.status === 200 && res.data) {
        setMiddlewareHostname(res.data.middleware_address);
      }
    };

    if (facilityId) fetchFacility();
  }, [dispatch, facilityId]);

  useEffect(() => {
    const fetchAssetData = async () => {
      let bedAssets = await dispatch(
        listAssetBeds({
          bed: patient?.last_consultation?.current_bed?.bed_object?.id,
        })
      );
      bedAssets = {
        ...bedAssets,
        data: {
          ...bedAssets.data,
          results: bedAssets.data.results.filter((assetBed: any) =>
            assetBed.asset_object.meta?.asset_type === "HL7MONITOR"
              ? true
              : false
          ),
        },
      };

      if (bedAssets.data.results.length > 0) {
        const asset: AssetData = bedAssets.data.results[0].asset_object;
        if (asset?.meta?.local_ip_address) {
          setWsUrl(
            `wss://${middlewareHostname}/observations/${asset?.meta?.local_ip_address}`
          );
        }
      }
    };

    if (patient?.last_consultation?.current_bed?.bed_object?.id)
      fetchAssetData();
  }, [
    dispatch,
    middlewareHostname,
    patient?.last_consultation?.current_bed?.bed_object?.id,
  ]);

  const connectWs = (url: string) => {
    wsClient.current = new WebSocket(url);
    wsClient.current.addEventListener("message", (e) => {
      const newObservations = JSON.parse(e.data || "{}");
      if (newObservations.length > 0) {
        setWaveForms(
          newObservations.filter((o: any) => o.observation_id === "waveform")
        );
        const newObservationsMap = newObservations.reduce(
          (acc: any, curr: { observation_id: any }) => ({
            ...acc,
            [curr.observation_id]: curr,
          }),
          {}
        );
        setPatientObservations(newObservationsMap);
      }
    });
  };

  useEffect(() => {
    if (socketUrl || wsUrl) connectWs(socketUrl || wsUrl);

    return () => {
      wsClient.current?.close();
    };
  }, [wsUrl, socketUrl]);

  useEffect(() => {
    return () => {
      wsClient.current?.close();
      setWaveForms(null);
    };
  }, [socketUrl, patient]);

  type VitalType = {
    label: ReactNode;
    liveKey: string;
    vitalKey: string;
    waveformKey?: string;
    waveformColor?: string;
    waveformName?: string;
    waveformDefaultSpace?: boolean;
    wavetype?: "STREAM" | "REFRESH";
  };

  const vitals: VitalType[] = [
    {
      label: shrinked ? "Pulse" : "Pulse Rate",
      liveKey: "pulse-rate",
      vitalKey: "pulse",
      waveformKey: "II",
      waveformColor: "limegreen",
      waveformName: "ECG",
      wavetype: "REFRESH",
    },
    {
      label: shrinked ? "BP" : "Blood Pressure",
      liveKey: "bp",
      vitalKey: "bp",
    },
    {
      label: (
        <>
          SpO<sub>2</sub>
        </>
      ),
      liveKey: "SpO2",
      vitalKey: "ventilator_spo2",
      waveformKey: "Pleth",
      waveformColor: "yellow",
    },
    {
      label: <>R. Rate</>,
      liveKey: "respiratory-rate",
      vitalKey: "resp",
      waveformKey: "Respiration",
      waveformColor: "cyan",
      //waveformDefaultSpace: true
    },
    {
      label: shrinked ? "Temp. (°F)" : "Temperature (°F)",
      liveKey: "body-temperature1",
      vitalKey: "temperature",
    },
  ];

  return (
    <div className=" w-full">
      <div
        className={classNames(
          "flex w-full flex-col items-stretch md:flex-row",
          shrinked && "bg-black"
        )}
      >
        <div className="relative flex h-auto w-full flex-col items-stretch bg-black py-2 text-gray-400">
          {waveforms ? (
            <>
              {vitals.map((v, i) => {
                const waveform: any = waveforms.filter(
                  (w) => w["wave-name"] === v.waveformKey
                )[0];
                return v.waveformKey && waveform ? (
                  <Waveform
                    key={i}
                    wave={{
                      ...waveform,
                      data: waveforms
                        .filter((w) => w["wave-name"] === v.waveformKey)
                        .map((w) => w.data)
                        .join(" "),
                    }}
                    title={v.waveformName || v.waveformKey}
                    color={v.waveformColor}
                    metrics={stats}
                    classes={"h-[150px]"}
                    defaultSpace={v.waveformDefaultSpace}
                    wavetype={v.wavetype || "STREAM"}
                  />
                ) : (
                  <div className="flex items-center justify-center text-gray-900"></div>
                );
              })}
              <div className="absolute bottom-1 right-1 flex gap-2">
                <ToolTip text="Toggle stats for nerds" position="LEFT">
                  <button onClick={() => setStats(!stats)}>
                    <i className="fas fa-chart-simple text-gray-400" />
                  </button>
                </ToolTip>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="w-[150px] text-center text-gray-800">
                <i className="fas fa-plug-circle-exclamation mb-4 text-4xl" />
                <div>No Live data at the moment!</div>
              </div>
            </div>
          )}
        </div>
        <div
          className={classNames(
            "flex w-full shrink-0 flex-row flex-wrap justify-between border-l border-l-gray-400 md:flex-col md:flex-nowrap md:justify-start",
            shrinked ? "p-2 text-gray-400 md:w-[120px]" : "p-3 md:w-[200px]"
          )}
        >
          {vitals.map((vital, i) => {
            const liveReading = getVital(patientObservations, vital.liveKey);
            return (
              <div key={i} className="h-[90px] p-2">
                <h2 className="text-xl font-bold md:text-3xl">
                  {liveReading ||
                    (vital.vitalKey === "bp"
                      ? `${
                          patient?.last_consultation?.last_daily_round?.bp
                            .systolic || "--"
                        }/${
                          patient?.last_consultation?.last_daily_round?.bp
                            .diastolic || "--"
                        }`
                      : patient?.last_consultation?.last_daily_round?.[
                          vital.vitalKey || ""
                        ]) ||
                    "--"}
                </h2>
                <div
                  className={classNames(
                    "text-xs",
                    shrinked ? "md:text-sm" : "md:text-base"
                  )}
                >
                  <div
                    className={classNames(
                      "mr-2 rounded-full",
                      shrinked ? "h-2 w-2" : "h-3 w-3",
                      liveReading ? "text-green-500" : "text-gray-500"
                    )}
                  />
                  {vital.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
