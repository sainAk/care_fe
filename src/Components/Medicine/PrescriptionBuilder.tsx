import { useCallback, useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import { NormalPrescription, Prescription } from "./models";
import DialogModal from "../Common/Dialog";
import { PRNPrescription } from "./models";
import CreatePrescriptionForm from "./CreatePrescriptionForm";
import PrescriptionDetailCard from "./PrescriptionDetailCard";
import { PrescriptionActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import DiscontinuePrescription from "./DiscontinuePrescription";
import AdministerMedicine from "./AdministerMedicine";

interface Props {
  prescription_type?: Prescription["prescription_type"];
  actions: ReturnType<typeof PrescriptionActions>;
  is_prn?: boolean;
  disabled?: boolean;
}

export default function PrescriptionBuilder({
  prescription_type,
  actions,
  is_prn = false,
  disabled,
}: Props) {
  const dispatch = useDispatch<any>();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>();
  const [showCreate, setShowCreate] = useState(false);
  const [showDiscontinueFor, setShowDiscontinueFor] = useState<Prescription>();
  const [showAdministerFor, setShowAdministerFor] = useState<Prescription>();

  const fetchPrescriptions = useCallback(() => {
    dispatch(actions.list({ is_prn, prescription_type })).then((res: any) =>
      setPrescriptions(res.data.results)
    );
  }, [dispatch, is_prn]);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div>
      {showDiscontinueFor && (
        <DiscontinuePrescription
          prescription={showDiscontinueFor}
          actions={actions.prescription(showDiscontinueFor.id!)}
          onClose={(success) => {
            setShowDiscontinueFor(undefined);
            if (success) fetchPrescriptions();
          }}
          key={showDiscontinueFor.id}
        />
      )}
      {showAdministerFor && (
        <AdministerMedicine
          prescription={showAdministerFor}
          actions={actions.prescription(showAdministerFor.id!)}
          onClose={(success) => {
            setShowAdministerFor(undefined);
            if (success) fetchPrescriptions();
          }}
          key={showAdministerFor.id}
        />
      )}
      <div className="flex flex-col gap-3">
        {prescriptions?.map((obj, index) => (
          <PrescriptionDetailCard
            key={index}
            prescription={obj}
            actions={actions.prescription(obj.id!)}
            onDiscontinueClick={() => setShowDiscontinueFor(obj)}
            onAdministerClick={() => setShowAdministerFor(obj)}
            readonly={disabled}
          />
        ))}
      </div>
      <ButtonV2
        type="button"
        onClick={() => setShowCreate(true)}
        variant="secondary"
        className="mt-4 bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900 w-full focus:outline focus:outline-1 focus:outline-offset-1 focus:bg-gray-100 focus:text-gray-900"
        align="start"
        disabled={disabled}
      >
        <CareIcon className="care-l-plus text-lg" />
        <span className="font-bold">
          Add {is_prn ? "PRN Prescription" : "Prescription"}
        </span>
      </ButtonV2>
      {showCreate && (
        <DialogModal
          onClose={() => setShowCreate(false)}
          show={showCreate}
          title={is_prn ? "Add PRN Prescription" : "Add Prescription"}
          description="Add a new prescription to this consultation."
          className="max-w-3xl w-full"
        >
          <CreatePrescriptionForm
            prescription={
              {
                ...(is_prn ? DefaultPRNPrescription : DefaultPrescription),
                prescription_type,
              } as Prescription
            }
            create={actions.create}
            onDone={() => {
              setShowCreate(false);
              fetchPrescriptions();
            }}
          />
        </DialogModal>
      )}
    </div>
  );
}

const DefaultPrescription: Partial<NormalPrescription> = { is_prn: false };
const DefaultPRNPrescription: Partial<PRNPrescription> = { is_prn: true };
