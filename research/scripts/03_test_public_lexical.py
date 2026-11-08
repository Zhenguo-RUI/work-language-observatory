import math
import unittest
from lexical_statistics import contingency, mh


class Checks(unittest.TestCase):
    def test_woolf_known_cells(self):
        result=contingency([[20,10],[10,20]])
        self.assertEqual(result["or"],4)
        self.assertAlmostEqual(result["or_ci95"][0],math.exp(math.log(4)-1.96*math.sqrt(.3)))
        self.assertAlmostEqual(result["or_ci95"][1],math.exp(math.log(4)+1.96*math.sqrt(.3)))

    def test_mh_known_ratio_and_source_order(self):
        tables=[contingency([[20,10],[10,20]]),contingency([[12,6],[6,12]])]
        result=mh(tables)
        self.assertAlmostEqual(result["or"],4)
        self.assertEqual(result["n"],96)
        self.assertEqual(result["or_ci95"],mh(tables[::-1])["or_ci95"])
        self.assertLess(result["or_ci95"][0],result["or"])
        self.assertGreater(result["or_ci95"][1],result["or"])

    def test_zero_cell_not_silently_corrected(self):
        self.assertIsNone(contingency([[1,0],[2,3]])["or"])
        self.assertIsNone(contingency([[0,1],[2,3]])["or_ci95"])

    def test_row_reversal_reciprocal(self):
        a=mh([contingency([[20,10],[10,20]])])
        b=mh([contingency([[10,20],[20,10]])])
        self.assertAlmostEqual(a["or"],1/b["or"])
        self.assertAlmostEqual(a["or_ci95"][0],1/b["or_ci95"][1])

if __name__=="__main__": unittest.main()
