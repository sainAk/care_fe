import { useState, useCallback, useEffect, lazy } from "react";

import { navigate } from "raviger";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getInventorySummary, getAnyFacility } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { classNames } from "../../Utils/utils";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
const Loading = lazy(() => import("../Common/Loading"));

export default function InventoryList(props: any) {
  const { facilityId }: any = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const initialInventory: any[] = [];
  let inventoryItem: any = null;
  const [inventory, setInventory] = useState(initialInventory);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const limit = 14;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInventorySummary(facilityId, { limit, offset })
      );
      if (!status.aborted) {
        if (res?.data) {
          setInventory(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, offset, facilityId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  useEffect(() => {
    async function fetchFacilityName() {
      if (facilityId) {
        const res = await dispatchAction(getAnyFacility(facilityId));

        setFacilityName(res?.data?.name || "");
      } else {
        setFacilityName("");
      }
    }
    fetchFacilityName();
  }, [dispatchAction, facilityId]);

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let inventoryList: any = [];
  if (inventory?.length) {
    inventoryList = inventory.map((inventoryItem: any) => (
      <tr
        key={inventoryItem.id}
        className={classNames(
          "cursor-pointer hover:bg-gray-200",
          inventoryItem.is_low ? "bg-red-100" : "bg-white"
        )}
        onClick={() =>
          navigate(
            `/facility/${facilityId}/inventory/${inventoryItem.item_object?.id}`
          )
        }
      >
        <td className="border-b border-gray-200 p-5 text-sm">
          <div className="flex items-center">
            <p className="whitespace-nowrap text-gray-900">
              {inventoryItem.item_object?.name}
              {inventoryItem.is_low && (
                <span className="badge badge-danger ml-2">Low Stock</span>
              )}
            </p>
          </div>
        </td>
        <td className="border-b border-gray-200 p-5 text-sm">
          <p className="whitespace-nowrap lowercase text-gray-900">
            {inventoryItem.quantity}{" "}
            {inventoryItem.item_object?.default_unit?.name}
          </p>
        </td>
      </tr>
    ));
  } else if (inventory && inventory.length === 0) {
    inventoryList = (
      <tr className="bg-white">
        <td colSpan={3} className="border-b border-gray-200 p-5 text-center">
          <p className="whitespace-nowrap text-gray-500">
            No inventory available
          </p>
        </td>
      </tr>
    );
  }

  if (isLoading || !inventory) {
    inventoryItem = <Loading />;
  } else if (inventory) {
    inventoryItem = (
      <>
        <div className="-mx-4 overflow-x-auto p-4 sm:-mx-8 sm:px-8">
          <div className="inline-block min-w-full">
            <table className="min-w-full overflow-hidden rounded-lg leading-normal shadow">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Name
                  </th>
                  <th className="border-b-2 border-gray-200 bg-primary-400 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>{inventoryList}</tbody>
            </table>
          </div>
        </div>
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <Page
      title="Inventory Manager"
      className="mx-3 md:mx-8"
      crumbsReplacements={{ [facilityId]: { name: facilityName } }}
      backUrl={`/facility/${facilityId}`}
    >
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-4 md:py-8">
          <div className="flex flex-col gap-2 md:flex-row">
            <ButtonV2
              className="w-full"
              href={`/facility/${facilityId}/inventory/add`}
              authorizeFor={NonReadOnlyUsers}
            >
              Manage Inventory
            </ButtonV2>
            <ButtonV2
              className="w-full"
              href={`/facility/${facilityId}/inventory/min_quantity/list`}
            >
              Minimum Quantity Required
            </ButtonV2>
          </div>
          {inventoryItem}
        </div>
      </div>
    </Page>
  );
}
