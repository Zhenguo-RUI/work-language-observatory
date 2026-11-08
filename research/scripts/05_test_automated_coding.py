"""Control-flow / privacy and diagnostic tests, not model accuracy tests."""
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('coding',Path(__file__).with_name('05_automated_coding.py'))
c=importlib.util.module_from_spec(spec); spec.loader.exec_module(c)

class CodingTests(unittest.TestCase):
    def occurrence(self,body):
        return c.occurrences([{'id':'synthetic','body':body,'title':'测试','platform':'test'}])
    def test_same_term_same_clause_dedup(self):
        rows=self.occurrence('沟通能力和沟通技巧；沟通客户')
        self.assertEqual(len(rows),2)
    def test_multiple_terms_distinct_units(self):
        self.assertEqual(len(self.occurrence('独立主动沟通')),3)
    def test_nonperson_units_retained_but_skipped(self):
        row=self.occurrence('开发主动安全功能')[0]
        self.assertEqual(c.code(row)['D1'],'C')
        self.assertIsNone(c.code(row)['D4'])
    def test_adjacent_scope_does_not_include_far_role(self):
        row=[r for r in self.occurrence('对接客户；计划；抗压能力；学习') if r['term']=='抗压'][0]
        self.assertFalse(c.code(row)['D3'])
    def test_team_not_specific_role(self):
        row=self.occurrence('沟通能力；团队合作')[0]
        self.assertFalse(c.code(row)['D3']); self.assertTrue(c.code(row)['D3_broad'])
    def test_assistance_is_not_approval(self):
        row=self.occurrence('主动协助处理任务')[0]
        self.assertEqual(c.code(row)['D5'],'not_stated')
    def test_manager_title_not_management(self):
        row={'title':'产品经理','body':'负责撰写需求文档'}
        self.assertEqual(c.role_candidate(row)['role'],'individual_tasks')
    def test_mixed_not_merged(self):
        row={'title':'主管','body':'负责管理下属工作；编写软件程序'}
        self.assertEqual(c.role_candidate(row)['role'],'mixed')
    def test_high_agreement_can_hide_missed_class(self):
        result=c.metric([('not_stated','not_stated')]*99+[('not_stated','yes')],['not_stated','yes'])
        self.assertEqual(result['agreement_rate'],.99)
        self.assertEqual(result['per_class']['yes']['recall_against_ai'],0)
    def test_samples_do_not_overlap_and_rerun_same(self):
        rows=[{'occurrence_id':str(i)} for i in range(100)]
        dev=c.sample(rows,'development',10); rem=[r for r in rows if r not in dev]
        review=c.sample(rem,'review',20)
        self.assertFalse({r['occurrence_id'] for r in dev}&{r['occurrence_id'] for r in review})
        self.assertEqual(review,c.sample(rem,'review',20))
    def test_small_group_rate_suppressed(self):
        rows=[{'rule':{'D1':'A','D3':True,'D3_broad':True,'D4':True,'D5':'not_stated'}}]
        self.assertIsNone(c.distribution(rows)['d4_rate'])

if __name__=='__main__': unittest.main()
