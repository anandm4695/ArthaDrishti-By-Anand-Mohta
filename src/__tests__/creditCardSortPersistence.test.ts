import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getSavedCreditCardSort,
  CC_SORT_STORAGE_KEY,
  VALID_CC_SORT_OPTIONS,
  CreditCardSortOption,
  getSavedPrepaidCardSort,
  PREPAID_SORT_STORAGE_KEY,
  VALID_PREPAID_SORTS,
  PrepaidCardSortOption,
} from "../components/tabs/CreditTab";

describe("Credit & Prepaid Cards Sorting Persistence Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Credit Card Sort Persistence", () => {
    it("defaults to 'outstanding_desc' when no sort preference exists in localStorage", () => {
      expect(getSavedCreditCardSort()).toBe("outstanding_desc");
    });

    it.each(VALID_CC_SORT_OPTIONS)(
      "correctly loads persisted sort option '%s' from localStorage",
      (option: CreditCardSortOption) => {
        localStorage.setItem(CC_SORT_STORAGE_KEY, option);
        expect(getSavedCreditCardSort()).toBe(option);
      }
    );

    it("gracefully falls back to 'outstanding_desc' if localStorage has invalid or corrupted data", () => {
      localStorage.setItem(CC_SORT_STORAGE_KEY, "invalid_option_xyz");
      expect(getSavedCreditCardSort()).toBe("outstanding_desc");

      localStorage.setItem(CC_SORT_STORAGE_KEY, "");
      expect(getSavedCreditCardSort()).toBe("outstanding_desc");
    });
  });

  describe("Prepaid Card Sort Persistence", () => {
    it("defaults to 'balance-desc' when no sort preference exists in localStorage", () => {
      expect(getSavedPrepaidCardSort()).toBe("balance-desc");
    });

    it.each(VALID_PREPAID_SORTS)(
      "correctly loads persisted prepaid sort option '%s' from localStorage",
      (option: PrepaidCardSortOption) => {
        localStorage.setItem(PREPAID_SORT_STORAGE_KEY, option);
        expect(getSavedPrepaidCardSort()).toBe(option);
      }
    );

    it("gracefully falls back to 'balance-desc' if localStorage has corrupted data", () => {
      localStorage.setItem(PREPAID_SORT_STORAGE_KEY, "non_existent_key");
      expect(getSavedPrepaidCardSort()).toBe("balance-desc");
    });
  });
});
